// Buzón de vetespana en Cloudflare. La web son archivos estáticos (out/); esto es
// lo ÚNICO que se ejecuta, y solo para /api/*:
//   POST /api/reviews  reseñas del formulario de cada ficha (components/ReviewForm.tsx)
//   POST /api/tally    altas de clínicas: webhook del formulario de Tally
// Todo se guarda tal cual en D1 (tabla buzon, ver buzon.sql). El servidor de casa lo
// recoge cada noche (scripts/recoger-buzon.mjs) y lo pasa a Postgres PENDIENTE de
// aprobar en NocoDB: aquí nada se publica directamente.

interface D1Database {
  prepare(sql: string): { bind(...valores: unknown[]): { run(): Promise<unknown> } }
}
interface Fetcher {
  fetch(request: Request): Promise<Response>
}
interface Env {
  ASSETS: Fetcher
  BUZON: D1Database
}

const MAX_BYTES = 64 * 1024
const FORMULARIO_TALLY = 'PdGVPe'

const buzon = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/reviews') return recibirResena(request, env)
    if (pathname === '/api/tally') return recibirTally(request, env)
    if (pathname.startsWith('/api/')) return json({ error: 'No encontrado' }, 404)
    return env.ASSETS.fetch(request)
  },
}

export default buzon

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
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

async function recibirResena(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) return json({ error: 'Petición no válida' }, 400)
  const c = await leerJson(request)
  if (!c) return json({ error: 'Petición no válida' }, 400)

  // Honeypot: si el campo trampa viene relleno es un bot. Respondemos "ok" sin guardar.
  if (c.website) return json({ ok: true })

  const clinicaId = String(c.clinicaId ?? '')
  const slug = String(c.slug ?? '')
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

  await guardar(env, 'resena', { clinicaId, slug, nombreUsuario: nombre, puntuacion, comentario })
  return json({ ok: true })
}

async function recibirTally(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  const c = await leerJson(request)
  const datos = c?.data as Record<string, unknown> | undefined
  if (!c || c.eventType !== 'FORM_RESPONSE' || !datos || datos.formId !== FORMULARIO_TALLY || !Array.isArray(datos.fields)) {
    return json({ error: 'Petición no válida' }, 400)
  }
  await guardar(env, 'alta', c)
  return json({ ok: true })
}
