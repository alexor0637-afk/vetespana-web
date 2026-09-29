// Recoge el buzón de Cloudflare (base D1 "vetespana-buzon", ver worker/) y lo pasa
// a Postgres, SIEMPRE pendiente de revisar en NocoDB:
//   reseñas              → tabla resenas (aprobada = false)
//   altas                → tabla altas (estado = pendiente): del formulario de la web y,
//                          las antiguas, de Tally
//   cambios de un dueño  → tabla ediciones (estado = pendiente), con el resumen
//                          «campo: antes → ahora» comparado con la clínica actual
// Las fotos (tabla archivos de D1, o enlaces de Tally) se guardan ya en data/fotos/.
// Cada envío se borra de D1 solo cuando ya está guardado en Postgres.
//
// Se ejecuta cada 10 minutos (contenedor de ~/homelab/vetespana-web):
//   node scripts/recoger-buzon.mjs
// Variables: DATABASE_URL_ESCRITURA, CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID, CARPETA_FOTOS y,
// opcional, CLOUDFLARE_API_TOKEN (si no está, se usa la sesión de `wrangler login`).
// Prueba sin Cloudflare: BUZON_JSON=envios.json (filas {id, tipo, datos, recibido}); no borra nada.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const { CLOUDFLARE_ACCOUNT_ID: CUENTA, CLOUDFLARE_API_TOKEN: TOKEN, D1_DATABASE_ID: BD, BUZON_JSON } = process.env
const CARPETA_FOTOS = process.env.CARPETA_FOTOS ?? '/fotos'
if (!BUZON_JSON && (!CUENTA || !BD)) {
  console.log('Buzón: falta la configuración de Cloudflare; no se recoge nada')
  process.exit(0)
}

async function d1(sql, params = []) {
  if (BUZON_JSON) {
    if (sql.startsWith('SELECT id, tipo')) return JSON.parse(fs.readFileSync(BUZON_JSON, 'utf8'))
    return [] // en prueba no hay fotos ni se borra nada
  }
  if (!TOKEN) {
    // Sesión de wrangler: consulta con la CLI (los únicos parámetros son ids enteros)
    const final = params.reduce((s, p) => {
      if (!Number.isInteger(p)) throw new Error(`parámetro no entero: ${p}`)
      return s.replace('?', String(p))
    }, sql)
    // Justo cuando wrangler renueva la sesión (cada hora) la primera consulta puede fallar
    // (error 7403): se reintenta un par de veces antes de darlo por fallido.
    for (let intento = 1; ; intento++) {
      try {
        const salida = execFileSync(
          'npx', ['wrangler', 'd1', 'execute', 'vetespana-buzon', '--remote', '--json', '--config', 'worker/wrangler.jsonc', '--command', final],
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 })
        return JSON.parse(salida)[0].results
      } catch (e) {
        if (intento >= 3) throw new Error(`D1 no responde: ${motivoWrangler(e)}`)
        await new Promise((r) => setTimeout(r, 5000 * intento))
      }
    }
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BD}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(`D1: ${JSON.stringify(json.errors)}`)
  return json.result[0].results
}

// El motivo de un fallo de wrangler en una línea (en vez de todo el volcado)
function motivoWrangler(e) {
  try {
    const { error } = JSON.parse(e.stdout)
    return [error.text, ...(error.notes ?? []).map((n) => n.text)].join(' ')
  } catch {
    return String(e.stderr || e.message).split('\n').find((l) => l.trim()) ?? 'error desconocido'
  }
}

const texto = (v) => (v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim())

// ── Fotos ────────────────────────────────────────────────────────────────────
const EXTENSIONES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

// Foto subida con el formulario de la web (guardada en la tabla archivos de D1)
async function guardarFotoDelBuzon(filaId, prefijo) {
  const [archivo] = await d1('SELECT tipo, datos FROM archivos WHERE buzon_id = ? ORDER BY id LIMIT 1', [filaId])
  if (!archivo) return null
  const nombre = `${prefijo}.${EXTENSIONES[archivo.tipo] ?? 'jpg'}`
  fs.writeFileSync(path.join(CARPETA_FOTOS, nombre), Buffer.from(archivo.datos, 'base64'))
  return nombre
}

// Tipo real de una imagen por sus primeros bytes (no por lo que diga el envío)
function tipoImagen(datos) {
  if (datos[0] === 0xff && datos[1] === 0xd8 && datos[2] === 0xff) return 'jpg'
  if (datos.subarray(0, 4).toString('hex') === '89504e47') return 'png'
  if (datos.subarray(0, 4).toString() === 'RIFF' && datos.subarray(8, 12).toString() === 'WEBP') return 'webp'
  return null
}

// Foto de un alta de Tally (enlace que puede caducar: se descarga ya). La URL viene dentro
// del envío, así que solo se descarga del almacenamiento de Tally, con tiempo y tamaño
// máximos, y solo si es de verdad una imagen. (La entrada /tally del buzón está cerrada
// desde el 29/09/2026: esto solo queda por si había alguna pendiente.)
const MAX_FOTO_TALLY = 5 * 1024 * 1024
async function descargarFotoTally(archivos, prefijo) {
  const f = Array.isArray(archivos) ? archivos[0] : null
  if (!f?.url) return null
  const url = new URL(f.url)
  if (url.protocol !== 'https:' || !(url.hostname === 'tally.so' || url.hostname.endsWith('.tally.so'))) {
    throw new Error(`foto fuera de Tally (${url.hostname})`)
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`foto ${res.status}`)
  if (Number(res.headers.get('content-length') ?? 0) > MAX_FOTO_TALLY) throw new Error('foto de más de 5 MB')
  const datos = Buffer.from(await res.arrayBuffer())
  if (datos.length > MAX_FOTO_TALLY) throw new Error('foto de más de 5 MB')
  const ext = tipoImagen(datos)
  if (!ext) throw new Error('la foto no es JPEG, PNG ni WebP')
  const nombre = `${prefijo}.${ext}`
  fs.writeFileSync(path.join(CARPETA_FOTOS, nombre), datos)
  return nombre
}

// ── Altas del formulario antiguo de Tally (PdGVPe), campos por su etiqueta ───
const CAMPOS_TALLY = [
  ['nombre', /^nombre/i],
  ['telefono', /^tel[eé]fono/i],
  ['email', /e-?mail|correo/i],
  ['direccion', /direcci[oó]n/i],
  ['ciudad', /^ciudad/i],
  ['web', /^web/i],
  ['especialidades', /especialidad/i],
  ['horario', /horario/i],
  ['urgencias', /urgencia/i],
  ['descripcion', /descripci[oó]n/i],
  ['foto', /logo|foto/i],
  ['whatsapp', /whatsapp/i],
  ['redes', /redes/i],
]

function valorTally(campo) {
  const v = campo.value
  if (v === null || v === undefined || v === '') return null
  if (Array.isArray(v)) {
    if (!v.length) return null
    if (typeof v[0] === 'object') return v // archivos: [{ url, name, mimeType, size }]
    const opciones = campo.options ?? []
    return v.map((id) => opciones.find((o) => o.id === id)?.text ?? id).join(', ')
  }
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  return String(v).trim() || null
}

function extraerTally(envio) {
  const r = {}
  for (const campo of envio.data?.fields ?? []) {
    const [clave] = CAMPOS_TALLY.find(([, re]) => re.test(campo.label ?? '')) ?? []
    if (clave && r[clave] === undefined) r[clave] = valorTally(campo)
  }
  return r
}

// ── Resumen de los cambios que pide un dueño («campo: antes → ahora») ────────
const COLUMNAS = {
  nombre: ['nombre', 'Nombre'],
  direccion: ['direccion', 'Dirección'],
  telefono: ['telefono', 'Teléfono'],
  whatsapp: ['whatsapp', 'WhatsApp'],
  email: ['email', 'Email'],
  web: ['web', 'Web'],
  redes: ['redes_sociales', 'Redes sociales'],
  horario: ['horario', 'Horario'],
  descripcion: ['descripcion', 'Descripción'],
}

function resumirCambios(actual, cambios, foto) {
  const lineas = []
  const vacio = (v) => (v === null || v === undefined || v === '' ? '(vacío)' : v)
  for (const [campo, [columna, etiqueta]] of Object.entries(COLUMNAS)) {
    if (!(campo in cambios)) continue
    const antes = texto(actual[columna])
    const ahora = texto(cambios[campo])
    if (antes === ahora) continue
    if (campo === 'horario' || campo === 'descripcion') {
      lineas.push(`${etiqueta}:\n  antes: ${vacio(antes).replaceAll('\n', '\n         ')}\n  ahora: ${vacio(ahora).replaceAll('\n', '\n         ')}`)
    } else {
      lineas.push(`${etiqueta}: ${vacio(antes)} → ${vacio(ahora)}`)
    }
  }
  const ciudadNueva = texto(cambios.ciudad) ?? texto(cambios.ciudadOtra)
  if (ciudadNueva) {
    lineas.push(`Ciudad: ${actual.ciudad} → ${ciudadNueva}${cambios.ciudadOtra ? ' (no está en la lista: hay que añadirla antes de aprobar)' : ''}`)
  }
  if (Array.isArray(cambios.especialidades)) {
    const antes = new Set(actual.especialidades)
    const ahora = new Set(cambios.especialidades)
    const mas = [...ahora].filter((e) => !antes.has(e))
    const menos = [...antes].filter((e) => !ahora.has(e))
    if (mas.length || menos.length) {
      lineas.push(`Especialidades: ${[...mas.map((e) => `+ ${e}`), ...menos.map((e) => `− ${e}`)].join(', ')}`)
    }
  }
  if (typeof cambios.urgencias24h === 'boolean' && cambios.urgencias24h !== actual.urgencias_24h) {
    lineas.push(`Urgencias 24 h: ${actual.urgencias_24h ? 'Sí' : 'No'} → ${cambios.urgencias24h ? 'Sí' : 'No'}`)
  }
  if (foto) lineas.push(`Foto de portada nueva: ${foto}`)
  return lineas.length ? lineas.join('\n') : '(sin cambios en los datos)'
}

// ── Recogida ─────────────────────────────────────────────────────────────────
let filas
try {
  filas = await d1('SELECT id, tipo, datos, recibido FROM buzon ORDER BY id LIMIT 200')
} catch (e) {
  console.error(`Buzón: no se ha podido leer (${e.message}); se reintentará en la próxima vuelta`)
  process.exit(1)
}
if (!filas.length) {
  console.log('Buzón: vacío')
  process.exit(0)
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_ESCRITURA })
await db.connect()
let resenas = 0, altas = 0, ediciones = 0, descartadas = 0, fallos = 0
for (const fila of filas) {
  try {
    const datos = JSON.parse(fila.datos)
    if (fila.tipo === 'resena') {
      const r = await db.query(
        `INSERT INTO resenas (clinica_id, nombre_usuario, puntuacion, comentario, fecha, aprobada)
         SELECT id, $2, $3, $4, $5::date, false FROM clinicas WHERE id = $1::bigint`,
        [datos.clinicaId, datos.nombreUsuario, datos.puntuacion, datos.comentario, fila.recibido.slice(0, 10)])
      if (r.rowCount) resenas++
      else descartadas++ // la clínica ya no existe
    } else if (fila.tipo === 'alta' && datos.origen === 'web') {
      const c = datos.clinica ?? {}
      const quien = datos.contacto ?? {}
      const foto = datos.foto ? await guardarFotoDelBuzon(fila.id, `alta-${fila.id}-${Date.now()}`) : null
      await db.query(
        `INSERT INTO altas (recibida, nombre, ciudad, direccion, telefono, email, web, whatsapp, redes_sociales,
                            especialidades, horario, urgencias_24h, descripcion, foto_archivo, datos,
                            solicitante, cargo, contacto_email, contacto_telefono, mensaje)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [fila.recibido, texto(c.nombre), texto(c.ciudad) ?? texto(c.ciudadOtra), texto(c.direccion), texto(c.telefono),
         texto(c.email), texto(c.web), texto(c.whatsapp), texto(c.redes),
         Array.isArray(c.especialidades) && c.especialidades.length ? c.especialidades.join(', ') : null,
         texto(c.horario), c.urgencias24h === true, texto(c.descripcion), foto, datos,
         texto(quien.nombre), texto(quien.cargo), texto(quien.email), texto(quien.telefono), texto(datos.mensaje)])
      altas++
    } else if (fila.tipo === 'alta') {
      const c = extraerTally(datos)
      let foto = null
      try {
        foto = await descargarFotoTally(c.foto, `alta-${fila.id}-${Date.now()}`)
      } catch (e) {
        console.error(`Buzón: no se pudo descargar la foto del alta ${fila.id}: ${e.message}`)
      }
      await db.query(
        `INSERT INTO altas (recibida, nombre, ciudad, direccion, telefono, email, web, whatsapp, redes_sociales,
                            especialidades, horario, urgencias_24h, descripcion, foto_archivo, datos)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [fila.recibido, c.nombre, c.ciudad, c.direccion, c.telefono, c.email, c.web, c.whatsapp, c.redes,
         c.especialidades, c.horario, c.urgencias ? /^s[ií]/i.test(c.urgencias) : null, c.descripcion, foto, datos])
      altas++
    } else if (fila.tipo === 'edicion') {
      const { rows: [actual] } = await db.query(
        `SELECT c.id, c.nombre, ci.nombre AS ciudad, c.direccion, c.telefono, c.whatsapp, c.email, c.web,
                c.redes_sociales, c.horario, c.descripcion, c.urgencias_24h,
                coalesce((SELECT array_agg(e.nombre) FROM clinica_especialidades ce
                          JOIN especialidades e ON e.id = ce.especialidad_id WHERE ce.clinica_id = c.id), '{}') AS especialidades
           FROM clinicas c JOIN ciudades ci ON ci.id = c.ciudad_id WHERE c.id = $1::bigint`,
        [datos.clinicaId])
      if (!actual) {
        descartadas++ // la clínica ya no existe
      } else {
        const quien = datos.contacto ?? {}
        const foto = datos.foto ? await guardarFotoDelBuzon(fila.id, `edicion-${fila.id}-${Date.now()}`) : null
        await db.query(
          `INSERT INTO ediciones (recibida, clinica_id, cambios, solicitante, cargo, contacto_email, contacto_telefono,
                                  mensaje, foto_archivo, datos)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [fila.recibido, actual.id, resumirCambios(actual, datos.cambios ?? {}, foto), texto(quien.nombre), texto(quien.cargo),
           texto(quien.email), texto(quien.telefono), texto(datos.mensaje), foto, datos])
        ediciones++
      }
    }
    await d1('DELETE FROM archivos WHERE buzon_id = ?', [fila.id])
    await d1('DELETE FROM buzon WHERE id = ?', [fila.id])
  } catch (e) {
    fallos++
    console.error(`Buzón: fila ${fila.id} (${fila.tipo}) no recogida: ${e.message}`)
  }
}
await db.end()
console.log(`Buzón: ${resenas} reseñas, ${altas} altas y ${ediciones} ediciones recogidas${descartadas ? ` · ${descartadas} descartadas (clínica inexistente)` : ''}${fallos ? ` · ${fallos} con error (se reintentarán)` : ''}`)
