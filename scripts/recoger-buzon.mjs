// Recoge el buzón de Cloudflare (base D1 "vetespana-buzon", ver worker/) y lo pasa
// a Postgres, SIEMPRE pendiente de revisar en NocoDB:
//   reseñas         → tabla resenas (aprobada = false)
//   altas de Tally  → tabla altas (estado = pendiente); la foto se descarga ya a
//                     data/fotos/ porque los enlaces de Tally pueden caducar
// Cada fila se borra de D1 solo cuando ya está guardada en Postgres.
//
// Se ejecuta en cada publicación (contenedor de ~/homelab/vetespana-web):
//   node scripts/recoger-buzon.mjs
// Variables: DATABASE_URL_ESCRITURA, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, D1_DATABASE_ID, CARPETA_FOTOS
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const { CLOUDFLARE_ACCOUNT_ID: CUENTA, CLOUDFLARE_API_TOKEN: TOKEN, D1_DATABASE_ID: BD } = process.env
const CARPETA_FOTOS = process.env.CARPETA_FOTOS ?? '/fotos'
if (!CUENTA || !TOKEN || !BD) {
  console.log('Buzón: faltan las credenciales de Cloudflare; no se recoge nada')
  process.exit(0)
}

async function d1(sql, params = []) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BD}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(`D1: ${JSON.stringify(json.errors)}`)
  return json.result[0].results
}

// ── Campos del formulario de Tally (PdGVPe), por su etiqueta ─────────────────
const CAMPOS = [
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

function valor(campo) {
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
    const [clave] = CAMPOS.find(([, re]) => re.test(campo.label ?? '')) ?? []
    if (clave && r[clave] === undefined) r[clave] = valor(campo)
  }
  return r
}

async function descargarFoto(archivos, prefijo) {
  const f = Array.isArray(archivos) ? archivos[0] : null
  if (!f?.url) return null
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[f.mimeType]
    ?? (path.extname(f.name ?? '').slice(1).toLowerCase() || 'jpg')
  const archivo = `${prefijo}.${ext}`
  const res = await fetch(f.url)
  if (!res.ok) throw new Error(`foto ${res.status}`)
  fs.writeFileSync(path.join(CARPETA_FOTOS, archivo), Buffer.from(await res.arrayBuffer()))
  return archivo
}

// ── Recogida ─────────────────────────────────────────────────────────────────
const filas = await d1('SELECT id, tipo, datos, recibido FROM buzon ORDER BY id LIMIT 500')
if (!filas.length) {
  console.log('Buzón: vacío')
  process.exit(0)
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_ESCRITURA })
await db.connect()
let resenas = 0, altas = 0, descartadas = 0, fallos = 0
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
    } else if (fila.tipo === 'alta') {
      const c = extraerTally(datos)
      let foto = null
      try {
        foto = await descargarFoto(c.foto, `alta-${fila.id}-${Date.now()}`)
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
    }
    await d1('DELETE FROM buzon WHERE id = ?', [fila.id])
  } catch (e) {
    fallos++
    console.error(`Buzón: fila ${fila.id} (${fila.tipo}) no recogida: ${e.message}`)
  }
}
await db.end()
console.log(`Buzón: ${resenas} reseñas y ${altas} altas recogidas${descartadas ? ` · ${descartadas} reseñas descartadas (clínica inexistente)` : ''}${fallos ? ` · ${fallos} con error (se reintentarán)` : ''}`)
