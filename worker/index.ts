// Buzón de vetespana en Cloudflare (Worker "vetespana-buzon", buzon.vetespana.es).
// La web son archivos estáticos (otro Worker, sin código); esto es lo ÚNICO que se
// ejecuta, y solo cuando alguien envía algo:
//   POST /resenas  reseñas del formulario de cada ficha (components/ReviewForm.tsx)
//   POST /tally    altas de clínicas: webhook del formulario de Tally
//   POST /aviso    avisos del servidor de casa (p. ej. una publicación fallida);
//                  necesita el token AVISO_TOKEN (secreto del Worker)
// Todo se guarda tal cual en D1 (tabla buzon, ver buzon.sql). El servidor de casa lo
// recoge cada 10 minutos (scripts/recoger-buzon.mjs) y lo pasa a Postgres PENDIENTE de
// aprobar en NocoDB: aquí nada se publica directamente.
// Cada envío guardado manda además un email de aviso al dueño (binding AVISOS: solo
// puede escribir a su dirección verificada en Email Routing).
import { EmailMessage } from 'cloudflare:email'

interface D1Database {
  prepare(sql: string): { bind(...valores: unknown[]): { run(): Promise<unknown> } }
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
const FORMULARIO_TALLY = 'PdGVPe'
// La web desde la que se aceptan reseñas (el navegador envía la cabecera Origin)
const ORIGENES = ['https://www.vetespana.es', 'https://vetespana.es']
const WEB = 'https://www.vetespana.es'
const NOCODB = 'http://100.109.136.103:8080'
const REMITENTE = 'avisos@vetespana.es'

const buzon = {
  async fetch(request: Request, env: Env, ctx: Contexto): Promise<Response> {
    const { pathname } = new URL(request.url)
    const origen = request.headers.get('origin') ?? ''
    if (pathname === '/resenas') {
      if (request.method === 'OPTIONS') return preflight(origen)
      return conCors(await recibirResena(request, env, ctx, origen), origen)
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

async function leerJson(request: Request): Promise<Record<string, unknown> | null> {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES) return null
  const texto = await request.text()
  if (texto.length > MAX_BYTES) return null
  try {
    const valor: unknown = JSON.parse(texto)
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null
  } catch {
    return null
  }
}

async function guardar(env: Env, tipo: 'resena' | 'alta', datos: unknown): Promise<void> {
  await env.BUZON.prepare('INSERT INTO buzon (tipo, datos) VALUES (?, ?)').bind(tipo, JSON.stringify(datos)).run()
}

// ── Reseñas ──────────────────────────────────────────────────────────────────
async function recibirResena(request: Request, env: Env, ctx: Contexto, origen: string): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  if (!ORIGENES.includes(origen)) return json({ error: 'Origen no permitido' }, 403)
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return json({ error: 'Petición no válida' }, 400)
  const c = await leerJson(request)
  if (!c) return json({ error: 'Petición no válida' }, 400)

  // Honeypot: si el campo trampa viene relleno es un bot. Respondemos "ok" sin guardar.
  if (c.website) return json({ ok: true })

  const clinicaId = String(c.clinicaId ?? '')
  const slug = String(c.slug ?? '')
  const clinicaNombre = String(c.clinicaNombre ?? '').trim().slice(0, 150)
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

// ── Altas del formulario de Tally ────────────────────────────────────────────
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
  ctx.waitUntil(avisar(env, `Nueva alta: ${nombre} (${ciudad})`, [
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
  const asunto = String(c?.asunto ?? '').trim().slice(0, 150)
  const texto = String(c?.texto ?? '').slice(0, 20000)
  if (!asunto) return json({ error: 'Falta el asunto' }, 400)
  const enviado = await avisar(env, asunto, [texto])
  return enviado ? json({ ok: true }) : json({ error: 'No se ha podido enviar el aviso' }, 502)
}

async function iguales(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all(
    [a, b].map(async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))))
  let distinto = 0
  for (let i = 0; i < ha.length; i++) distinto |= ha[i] ^ hb[i]
  return distinto === 0
}

// ── Email de aviso al dueño ──────────────────────────────────────────────────
async function avisar(env: Env, asunto: string, lineas: string[]): Promise<boolean> {
  if (!env.AVISOS || !env.AVISOS_DESTINO) return false
  const texto = [
    ...lineas,
    '',
    `NocoDB (con Tailscale activado): ${NOCODB}`,
    'Lo nuevo llega a NocoDB en unos minutos.',
    '',
    '-- ',
    'Aviso automático del buzón de vetespana.es',
  ].join('\n')
  try {
    await env.AVISOS.send(new EmailMessage(REMITENTE, env.AVISOS_DESTINO, mime(env.AVISOS_DESTINO, asunto, texto)))
    return true
  } catch (e) {
    console.error('Aviso no enviado:', e)
    return false
  }
}

function base64(texto: string): string {
  let binario = ''
  for (const byte of new TextEncoder().encode(texto)) binario += String.fromCharCode(byte)
  return btoa(binario)
}

// Cabecera con acentos (RFC 2047), en trozos cortos para no pasar de 75 caracteres por palabra
function cabeceraUtf8(texto: string): string {
  const trozos: string[] = []
  let actual = ''
  for (const letra of texto) {
    if (new TextEncoder().encode(actual + letra).length > 42) {
      trozos.push(actual)
      actual = ''
    }
    actual += letra
  }
  if (actual) trozos.push(actual)
  return trozos.map((t) => `=?UTF-8?B?${base64(t)}?=`).join('\r\n ')
}

function mime(para: string, asunto: string, texto: string): string {
  const cuerpo = base64(texto.replace(/\r?\n/g, '\r\n')).replace(/.{76}/g, '$&\r\n')
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
    cuerpo,
  ].join('\r\n')
}
