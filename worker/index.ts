// Buzón de vetespana en Cloudflare (Worker "vetespana-buzon", buzon.vetespana.es).
// La web son archivos estáticos (otro Worker, sin código); esto es lo ÚNICO que se
// ejecuta, y solo cuando alguien envía algo:
//   POST /resenas    reseñas del formulario de cada ficha (components/ReviewForm.tsx)
//   POST /altas      altas de clínicas nuevas (components/FormularioClinica.tsx)
//   POST /ediciones  cambios que pide el dueño de una clínica (el mismo formulario)
//   POST /tally      altas del formulario antiguo de Tally (webhook), por si aún llega alguna
//   POST /aviso      avisos del servidor de casa (p. ej. una publicación fallida);
//                    necesita el token AVISO_TOKEN (secreto del Worker)
// Todo se guarda tal cual en D1 (ver buzon.sql). El servidor de casa lo recoge cada
// 10 minutos (scripts/recoger-buzon.mjs) y lo pasa a Postgres PENDIENTE de aprobar en
// NocoDB: aquí nada se publica directamente.
// Cada envío guardado manda además un email de aviso al dueño (binding AVISOS: solo
// puede escribir a su dirección verificada en Email Routing).
import { EmailMessage } from 'cloudflare:email'

interface D1Consulta {
  bind(...valores: unknown[]): D1Consulta
  run(): Promise<unknown>
  first<T = Record<string, unknown>>(): Promise<T | null>
}
interface D1Database {
  prepare(sql: string): D1Consulta
}
interface SendEmail {
  send(mensaje: EmailMessage): Promise<void>
}
interface Env {
  BUZON: D1Database
  AVISOS?: SendEmail
  AVISOS_DESTINO?: string
  AVISO_TOKEN?: string
}
interface Contexto {
  waitUntil(promesa: Promise<unknown>): void
}

const MAX_BYTES = 64 * 1024
const MAX_BYTES_FORMULARIO = 2_300_000 // con una foto ya reducida en el navegador
const MAX_FOTO_BASE64 = 1_600_000 // ~1,2 MB de imagen (una fila de D1 admite 2 MB)
const FORMULARIO_TALLY = 'PdGVPe'
// La web desde la que se aceptan envíos (el navegador envía la cabecera Origin)
const ORIGENES = ['https://www.vetespana.es', 'https://vetespana.es']
const WEB = 'https://www.vetespana.es'
const NOCODB = 'http://100.109.136.103:8080'
const REMITENTE = 'avisos@vetespana.es'
// Mismos valores que ESPECIALIDADES en src/types/clinic.ts
const ESPECIALIDADES = [
  'Perros', 'Gatos', 'Animales exóticos', 'Reptiles', 'Aves', 'Urgencias', 'Cirugía',
  'Dermatología', 'Odontología', 'Traumatología', 'Oncología', 'Cardiología', 'Hospitalización',
]

const buzon = {
  async fetch(request: Request, env: Env, ctx: Contexto): Promise<Response> {
    const { pathname } = new URL(request.url)
    const origen = request.headers.get('origin') ?? ''
    const deLaWeb: Record<string, (r: Request, e: Env, c: Contexto) => Promise<Response>> = {
      '/resenas': recibirResena,
      '/altas': (r, e, c) => recibirFormulario(r, e, c, 'alta'),
      '/ediciones': (r, e, c) => recibirFormulario(r, e, c, 'edicion'),
    }
    const manejador = deLaWeb[pathname]
    if (manejador) {
      if (request.method === 'OPTIONS') return preflight(origen)
      if (request.method !== 'POST') return conCors(json({ error: 'Método no permitido' }, 405), origen)
      if (!ORIGENES.includes(origen)) return json({ error: 'Origen no permitido' }, 403)
      if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
        return conCors(json({ error: 'Petición no válida' }, 400), origen)
      }
      return conCors(await manejador(request, env, ctx), origen)
    }
    if (pathname === '/tally') return recibirTally(request, env, ctx)
    if (pathname === '/aviso') return recibirAviso(request, env)
    return json({ error: 'No encontrado' }, 404)
  },
}

export default buzon

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

function preflight(origen: string): Response {
  if (!ORIGENES.includes(origen)) return new Response(null, { status: 403 })
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': origen,
      'access-control-allow-methods': 'POST',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
      vary: 'Origin',
    },
  })
}

function conCors(res: Response, origen: string): Response {
  if (!ORIGENES.includes(origen)) return res
  const r = new Response(res.body, res)
  r.headers.set('access-control-allow-origin', origen)
  r.headers.set('vary', 'Origin')
  return r
}

async function leerJson(request: Request, maximo = MAX_BYTES): Promise<Record<string, unknown> | null> {
  if (Number(request.headers.get('content-length') ?? 0) > maximo) return null
  const texto = await request.text()
  if (texto.length > maximo) return null
  try {
    const valor: unknown = JSON.parse(texto)
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null
  } catch {
    return null
  }
}

async function guardar(env: Env, tipo: 'resena' | 'alta' | 'edicion', datos: unknown): Promise<number> {
  const fila = await env.BUZON.prepare('INSERT INTO buzon (tipo, datos) VALUES (?, ?) RETURNING id')
    .bind(tipo, JSON.stringify(datos)).first<{ id: number }>()
  return fila?.id ?? 0
}

async function sha256(texto: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)))
  return [...hash].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Límite de envíos por persona (IP resumida) y hora. Si el contador falla, no se
// bloquea a nadie: todo pasa igualmente por la revisión del dueño.
async function limiteSuperado(env: Env, request: Request, tipo: string, maximo: number): Promise<boolean> {
  const hora = Math.floor(Date.now() / 3_600_000)
  const huella = (await sha256(`${request.headers.get('cf-connecting-ip') ?? ''}|vetespana`)).slice(0, 16)
  try {
    const fila = await env.BUZON.prepare(
      'INSERT INTO limites (clave, n) VALUES (?, 1) ON CONFLICT (clave) DO UPDATE SET n = n + 1 RETURNING n',
    ).bind(`${hora}:${tipo}:${huella}`).first<{ n: number }>()
    if (Math.random() < 0.05) await env.BUZON.prepare('DELETE FROM limites WHERE clave < ?').bind(`${hora}:`).run()
    return (fila?.n ?? 0) > maximo
  } catch {
    return false
  }
}

const texto = (v: unknown, maximo: number): string => (typeof v === 'string' ? v.trim().slice(0, maximo) : '')
const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const telefonoValido = (v: string) => v.replace(/\D/g, '').length >= 9

// ── Reseñas ──────────────────────────────────────────────────────────────────
async function recibirResena(request: Request, env: Env, ctx: Contexto): Promise<Response> {
  const c = await leerJson(request)
  if (!c) return json({ error: 'Petición no válida' }, 400)

  // Honeypot: si el campo trampa viene relleno es un bot. Respondemos "ok" sin guardar.
  if (c.website) return json({ ok: true })

  const clinicaId = String(c.clinicaId ?? '')
  const slug = String(c.slug ?? '')
  const clinicaNombre = texto(c.clinicaNombre, 150)
  const nombre = String(c.nombreUsuario ?? '').trim()
  const comentario = String(c.comentario ?? '').trim()
  const puntuacion = Number(c.puntuacion)
  if (!/^\d{1,12}$/.test(clinicaId) || !/^[a-z0-9-]{1,200}$/.test(slug)) return json({ error: 'Clínica no válida' }, 400)
  if (!nombre || nombre.length > 60) return json({ error: 'Falta tu nombre' }, 400)
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) return json({ error: 'La puntuación debe ser entre 1 y 5' }, 400)
  if (comentario.length < 10 || comentario.length > 500) return json({ error: 'El comentario debe tener entre 10 y 500 caracteres' }, 400)

  // Filtro anti-spam: las reseñas con varios enlaces casi siempre son spam.
  const enlaces = (comentario.match(/https?:\/\/|www\.|\.(com|net|ru|xyz|info)\b/gi) ?? []).length
  if (enlaces >= 2) return json({ ok: true })
  if (await limiteSuperado(env, request, 'resena', 10)) {
    return json({ error: 'Has enviado muchas reseñas seguidas. Prueba otra vez dentro de un rato.' }, 429)
  }

  await guardar(env, 'resena', { clinicaId, slug, clinicaNombre, nombreUsuario: nombre, puntuacion, comentario })
  ctx.waitUntil(avisar(env, `Nueva reseña: ${clinicaNombre || slug}`, [
    `${'★'.repeat(puntuacion)}${'☆'.repeat(5 - puntuacion)} (${puntuacion} de 5), de ${nombre}`,
    `Clínica: ${clinicaNombre || slug}`,
    `${WEB}/clinicas/${slug}`,
    '',
    comentario,
    '',
    'Para publicarla: en NocoDB, tabla «resenas», marca «aprobada».',
    'Si es spam o una falta de respeto, borra la fila.',
  ]))
  return json({ ok: true })
}

// ── Altas y cambios del formulario de la web ─────────────────────────────────
const MAXIMOS: Record<string, number> = {
  nombre: 120, ciudad: 80, ciudadOtra: 80, direccion: 200, telefono: 40, whatsapp: 40,
  email: 120, web: 200, redes: 200, horario: 1000, descripcion: 1000,
}
const ETIQUETAS: Record<string, string> = {
  nombre: 'Nombre', ciudad: 'Ciudad', ciudadOtra: 'Ciudad (no está en la lista)', direccion: 'Dirección',
  telefono: 'Teléfono', whatsapp: 'WhatsApp', email: 'Email', web: 'Web', redes: 'Redes sociales',
  horario: 'Horario', descripcion: 'Descripción', especialidades: 'Especialidades', urgencias24h: 'Urgencias 24 h',
}

type Datos = Record<string, string | boolean | string[]>

// Solo los campos conocidos, recortados; lo demás se ignora
function limpiarCampos(bruto: unknown): Datos {
  const c = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, unknown>
  const limpio: Datos = {}
  for (const [campo, maximo] of Object.entries(MAXIMOS)) {
    if (typeof c[campo] === 'string') limpio[campo] = texto(c[campo], maximo)
  }
  if (Array.isArray(c.especialidades)) {
    limpio.especialidades = ESPECIALIDADES.filter((e) => (c.especialidades as unknown[]).includes(e))
  }
  if (typeof c.urgencias24h === 'boolean') limpio.urgencias24h = c.urgencias24h
  return limpio
}

function valorLegible(v: string | boolean | string[]): string {
  if (Array.isArray(v)) return v.length ? v.join(', ') : '(ninguna)'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  return v || '(vacío)'
}

async function recibirFormulario(request: Request, env: Env, ctx: Contexto, tipo: 'alta' | 'edicion'): Promise<Response> {
  const c = await leerJson(request, MAX_BYTES_FORMULARIO)
  if (!c) return json({ error: 'El envío es demasiado grande o no es válido. Prueba con una foto más pequeña.' }, 400)

  // Trampas para robots: campo oculto relleno o formulario rellenado en menos de 3 s.
  // Se responde "ok" sin guardar nada.
  if (c.website || Number(c.ms ?? 0) < 3000) return json({ ok: true })

  const contacto = (c.contacto && typeof c.contacto === 'object' ? c.contacto : {}) as Record<string, unknown>
  const quien = {
    nombre: texto(contacto.nombre, 80),
    cargo: texto(contacto.cargo, 60),
    email: texto(contacto.email, 120),
    telefono: texto(contacto.telefono, 40),
  }
  const mensaje = texto(c.mensaje, 1000)
  if (quien.nombre.length < 2) return json({ error: 'Falta tu nombre' }, 400)
  if (!quien.email && !quien.telefono) return json({ error: 'Déjanos un email o un teléfono de contacto' }, 400)
  if (quien.email && !emailValido(quien.email)) return json({ error: 'El email de contacto no parece válido' }, 400)
  if (c.acepta !== true) return json({ error: 'Falta aceptar el uso de los datos' }, 400)

  // Foto (opcional), ya reducida en el navegador
  const foto = c.foto && typeof c.foto === 'object' ? (c.foto as Record<string, unknown>) : null
  let archivo: { tipo: string; datos: string } | null = null
  if (foto) {
    const datos = typeof foto.datos === 'string' ? foto.datos : ''
    const tipoFoto = String(foto.tipo ?? '')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(tipoFoto) || !/^[A-Za-z0-9+/]+={0,2}$/.test(datos)) {
      return json({ error: 'La foto no es válida' }, 400)
    }
    if (datos.length > MAX_FOTO_BASE64) return json({ error: 'La foto es demasiado grande' }, 413)
    archivo = { tipo: tipoFoto, datos }
  }

  let registro: Record<string, unknown>
  let asunto: string
  let lineas: string[]
  if (tipo === 'alta') {
    const clinica = limpiarCampos(c.clinica)
    if (String(clinica.nombre ?? '').length < 2) return json({ error: 'Falta el nombre de la clínica' }, 400)
    if (!clinica.ciudad && !clinica.ciudadOtra) return json({ error: 'Falta la ciudad' }, 400)
    if (String(clinica.direccion ?? '').length < 5) return json({ error: 'Falta la dirección' }, 400)
    if (!telefonoValido(String(clinica.telefono ?? ''))) return json({ error: 'El teléfono de la clínica no parece válido' }, 400)
    if (clinica.email && !emailValido(String(clinica.email))) return json({ error: 'El email de la clínica no parece válido' }, 400)
    registro = { origen: 'web', clinica, contacto: quien, mensaje, foto: Boolean(archivo) }
    const ciudad = String(clinica.ciudad || clinica.ciudadOtra)
    asunto = `Nueva alta: ${String(clinica.nombre)} (${ciudad})`
    lineas = [
      ...Object.entries(clinica).map(([campo, v]) => `${ETIQUETAS[campo] ?? campo}: ${valorLegible(v)}`),
      archivo ? 'Foto: sí (la verás en NocoDB)' : 'Foto: no',
      '',
      `Enviada por: ${quien.nombre}${quien.cargo ? ` (${quien.cargo})` : ''} · ${[quien.email, quien.telefono].filter(Boolean).join(' · ')}`,
      ...(mensaje ? ['', `Mensaje: ${mensaje}`] : []),
      '',
      'Para publicarla: en NocoDB, tabla «altas», revisa los datos y pon el estado en «aprobada».',
      'Si es spam o está repetida, ponla en «descartada».',
    ]
  } else {
    const clinicaId = String(c.clinicaId ?? '')
    const slug = String(c.slug ?? '')
    const clinicaNombre = texto(c.clinicaNombre, 150)
    if (!/^\d{1,12}$/.test(clinicaId) || !/^[a-z0-9-]{1,200}$/.test(slug)) return json({ error: 'Clínica no válida' }, 400)
    const cambios = limpiarCampos(c.cambios)
    if (cambios.telefono && !telefonoValido(String(cambios.telefono))) return json({ error: 'El teléfono de la clínica no parece válido' }, 400)
    if (cambios.email && !emailValido(String(cambios.email))) return json({ error: 'El email de la clínica no parece válido' }, 400)
    if (!Object.keys(cambios).length && !archivo && !mensaje) return json({ error: 'No has cambiado ningún dato' }, 400)
    registro = { origen: 'web', clinicaId, slug, clinicaNombre, cambios, contacto: quien, mensaje, foto: Boolean(archivo) }
    asunto = `Cambios pedidos: ${clinicaNombre || slug}`
    lineas = [
      `${quien.nombre}${quien.cargo ? ` (${quien.cargo})` : ''} pide cambiar datos de ${clinicaNombre || slug}`,
      `${WEB}/clinicas/${slug}`,
      `Contacto: ${[quien.email, quien.telefono].filter(Boolean).join(' · ')}`,
      '',
      'Datos nuevos que propone:',
      ...Object.entries(cambios).map(([campo, v]) =>
        campo === 'horario' || campo === 'descripcion'
          ? `- ${ETIQUETAS[campo]}:\n${String(v).split('\n').map((l) => `    ${l}`).join('\n')}`
          : `- ${ETIQUETAS[campo] ?? campo}: ${valorLegible(v)}`),
      ...(archivo ? ['- Foto de portada nueva (la verás en NocoDB)'] : []),
      ...(Object.keys(cambios).length || archivo ? [] : ['(ningún dato: solo un mensaje)']),
      ...(mensaje ? ['', `Mensaje: ${mensaje}`] : []),
      '',
      'Para aplicarlos: en NocoDB, tabla «ediciones» (allí verás el antes y el después), pon el estado en «aprobada».',
      'Si no te convence, ponla en «descartada».',
    ]
  }

  if (await limiteSuperado(env, request, 'formulario', 6)) {
    return json({ error: 'Has hecho muchos envíos seguidos. Prueba otra vez dentro de un rato.' }, 429)
  }
  const id = await guardar(env, tipo, registro)
  if (archivo && id) {
    await env.BUZON.prepare('INSERT INTO archivos (buzon_id, tipo, datos) VALUES (?, ?, ?)').bind(id, archivo.tipo, archivo.datos).run()
  }
  ctx.waitUntil(avisar(env, asunto, lineas))
  return json({ ok: true })
}

// ── Altas del formulario antiguo de Tally ────────────────────────────────────
interface CampoTally {
  label?: string
  value?: unknown
  options?: { id: string; text: string }[]
}

function valorTally(campos: CampoTally[], etiqueta: RegExp): string {
  const campo = campos.find((f) => etiqueta.test(f.label ?? ''))
  const v = campo?.value
  if (v === null || v === undefined || v === '') return '—'
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === 'string' ? campo?.options?.find((o) => o.id === x)?.text ?? x : 'archivo')).join(', ')
  }
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  return String(v).slice(0, 300)
}

async function recibirTally(request: Request, env: Env, ctx: Contexto): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  const c = await leerJson(request)
  const datos = c?.data as Record<string, unknown> | undefined
  if (!c || c.eventType !== 'FORM_RESPONSE' || !datos || datos.formId !== FORMULARIO_TALLY || !Array.isArray(datos.fields)) {
    return json({ error: 'Petición no válida' }, 400)
  }
  await guardar(env, 'alta', c)
  const campos = datos.fields as CampoTally[]
  const nombre = valorTally(campos, /^nombre/i)
  const ciudad = valorTally(campos, /^ciudad/i)
  ctx.waitUntil(avisar(env, `Nueva alta (Tally): ${nombre} (${ciudad})`, [
    `Clínica: ${nombre}`,
    `Ciudad: ${ciudad}`,
    `Dirección: ${valorTally(campos, /direcci[oó]n/i)}`,
    `Teléfono: ${valorTally(campos, /^tel[eé]fono/i)}`,
    `Email: ${valorTally(campos, /e-?mail|correo/i)}`,
    `Web: ${valorTally(campos, /^web/i)}`,
    '',
    'Para publicarla: en NocoDB, tabla «altas», revisa los datos y pon el estado en «aprobada».',
    'Si es spam o está repetida, ponla en «descartada».',
  ]))
  return json({ ok: true })
}

// ── Avisos del servidor de casa ──────────────────────────────────────────────
async function recibirAviso(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  if (!env.AVISO_TOKEN || !(await iguales(request.headers.get('authorization') ?? '', `Bearer ${env.AVISO_TOKEN}`))) {
    return json({ error: 'No autorizado' }, 401)
  }
  const c = await leerJson(request)
  const asunto = texto(c?.asunto, 150)
  const cuerpo = typeof c?.texto === 'string' ? c.texto.slice(0, 20000) : ''
  if (!asunto) return json({ error: 'Falta el asunto' }, 400)
  const enviado = await avisar(env, asunto, [cuerpo])
  return enviado ? json({ ok: true }) : json({ error: 'No se ha podido enviar el aviso' }, 502)
}

async function iguales(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)])
  let distinto = 0
  for (let i = 0; i < ha.length; i++) distinto |= ha.charCodeAt(i) ^ hb.charCodeAt(i)
  return distinto === 0
}

// ── Email de aviso al dueño ──────────────────────────────────────────────────
async function avisar(env: Env, asunto: string, lineas: string[]): Promise<boolean> {
  if (!env.AVISOS || !env.AVISOS_DESTINO) return false
  const cuerpo = [
    ...lineas,
    '',
    `NocoDB (con Tailscale activado): ${NOCODB}`,
    'Lo nuevo llega a NocoDB en unos minutos.',
    '',
    '-- ',
    'Aviso automático del buzón de vetespana.es',
  ].join('\n')
  try {
    await env.AVISOS.send(new EmailMessage(REMITENTE, env.AVISOS_DESTINO, mime(env.AVISOS_DESTINO, asunto, cuerpo)))
    return true
  } catch (e) {
    console.error('Aviso no enviado:', e)
    return false
  }
}

function base64(cadena: string): string {
  let binario = ''
  for (const byte of new TextEncoder().encode(cadena)) binario += String.fromCharCode(byte)
  return btoa(binario)
}

// Cabecera con acentos (RFC 2047), en trozos cortos para no pasar de 75 caracteres por palabra
function cabeceraUtf8(cadena: string): string {
  const trozos: string[] = []
  let actual = ''
  for (const letra of cadena) {
    if (new TextEncoder().encode(actual + letra).length > 42) {
      trozos.push(actual)
      actual = ''
    }
    actual += letra
  }
  if (actual) trozos.push(actual)
  return trozos.map((t) => `=?UTF-8?B?${base64(t)}?=`).join('\r\n ')
}

function mime(para: string, asunto: string, cuerpo: string): string {
  const codificado = base64(cuerpo.replace(/\r?\n/g, '\r\n')).replace(/.{76}/g, '$&\r\n')
  return [
    `From: ${cabeceraUtf8('VetEspaña avisos')} <${REMITENTE}>`,
    `To: <${para}>`,
    `Subject: ${cabeceraUtf8(asunto)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@vetespana.es>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    codificado,
  ].join('\r\n')
}
