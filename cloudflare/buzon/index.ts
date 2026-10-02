// Buzón de vetespana en Cloudflare (Worker "vetespana-buzon", buzon.vetespana.es).
// La web son archivos estáticos (otro Worker, sin código); esto es lo ÚNICO que se
// ejecuta, y solo cuando alguien envía algo:
//   POST /resenas    reseñas del formulario de cada ficha (componentes/formularios/FormularioResena.tsx)
//   POST /altas      altas de clínicas nuevas (componentes/formularios/FormularioClinica.tsx)
//   POST /ediciones  cambios que pide el dueño de una clínica (el mismo formulario)
//   /tally           cerrado (410): era el webhook del formulario antiguo de Tally, que
//                    aceptaba envíos de cualquiera sin firma ni límite (29/09/2026)
//   POST /aviso     avisos del servidor de casa (p. ej. una publicación fallida);
//                    necesita el token AVISO_TOKEN (secreto del Worker)
// Todo se guarda tal cual en D1 (ver buzon.sql). El servidor de casa lo recoge cada
// 10 minutos (tareas/recoger-buzon.mjs) y lo pasa a Postgres PENDIENTE de aprobar en
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
  batch(consultas: D1Consulta[]): Promise<unknown[]>
}
interface SendEmail {
  send(mensaje: EmailMessage): Promise<void>
}
interface Env {
  BUZON: D1Database
  AVISOS?: SendEmail
  AVISOS_DESTINO?: string
  AVISO_TOKEN?: string
  TURNSTILE_SECRET?: string
}
interface Contexto {
  waitUntil(promesa: Promise<unknown>): void
}

const MAX_BYTES = 64 * 1024
const MAX_BYTES_FORMULARIO = 2_300_000 // con una foto ya reducida en el navegador
const MAX_FOTO_BASE64 = 1_600_000 // ~1,2 MB de imagen (una fila de D1 admite 2 MB)
// La web desde la que se aceptan envíos (el navegador envía la cabecera Origin)
const ORIGENES = ['https://www.vetespana.es', 'https://vetespana.es']
const WEB = 'https://www.vetespana.es'
const NOCODB = 'http://100.109.136.103:8080'
const REMITENTE = 'avisos@vetespana.es'
// Mismos valores que ESPECIALIDADES en src/tipos/clinica.ts
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
      try {
        return conCors(await manejador(request, env, ctx), origen)
      } catch (e) {
        // Error inesperado (p. ej. D1 no responde): respuesta clara y con CORS, sin detalles
        console.error('Error en el buzón:', e)
        return conCors(json({ error: 'No se ha podido guardar el envío. Prueba otra vez dentro de un rato.' }, 500), origen)
      }
    }
    if (pathname === '/tally') return json({ error: 'Este formulario ya no se usa: https://www.vetespana.es/alta-clinica' }, 410)
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

// Guarda el envío y su foto (si la hay) de una vez, en una sola transacción de D1: o se
// guarda todo o nada (así no quedan altas sin foto ni fotos sueltas)
async function guardar(
  env: Env, tipo: 'resena' | 'alta' | 'edicion', datos: unknown, archivo?: { tipo: string; datos: string } | null,
): Promise<void> {
  const envio = env.BUZON.prepare('INSERT INTO buzon (tipo, datos) VALUES (?, ?)').bind(tipo, JSON.stringify(datos))
  if (!archivo) {
    await envio.run()
    return
  }
  await env.BUZON.batch([
    envio,
    env.BUZON.prepare('INSERT INTO archivos (buzon_id, tipo, datos) VALUES (last_insert_rowid(), ?, ?)').bind(archivo.tipo, archivo.datos),
  ])
}

async function sha256(texto: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)))
  return [...hash].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Comprobación anti-robots (Cloudflare Turnstile): el navegador manda un token de un solo
// uso y aquí se valida con Cloudflare. Sin secreto configurado no se exige (no rompe nada).
async function turnstileValido(env: Env, token: unknown, request: Request): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true
  if (typeof token !== 'string' || !token || token.length > 2048) return false
  const cuerpo = new FormData()
  cuerpo.append('secret', env.TURNSTILE_SECRET)
  cuerpo.append('response', token)
  const ip = request.headers.get('cf-connecting-ip')
  if (ip) cuerpo.append('remoteip', ip)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: cuerpo })
    const r = (await res.json()) as { success?: boolean; hostname?: string }
    return r.success === true && (!r.hostname || /(^|\.)vetespana\.es$/.test(r.hostname))
  } catch {
    return false
  }
}

const NO_ROBOT = 'No hemos podido comprobar que no eres un robot. Recarga la página y vuelve a intentarlo.'

// Tipo real de una foto en base64 por sus primeros bytes (JPEG, PNG o WebP)
function tipoRealFoto(datosBase64: string): string | null {
  let cabecera: string
  try {
    cabecera = atob(datosBase64.slice(0, 16))
  } catch {
    return null
  }
  if (cabecera.startsWith('\xFF\xD8\xFF')) return 'image/jpeg'
  if (cabecera.startsWith('\x89PNG')) return 'image/png'
  if (cabecera.startsWith('RIFF') && cabecera.slice(8, 12) === 'WEBP') return 'image/webp'
  return null
}

// Quién envía, para el límite: la IP, o su red /64 si es IPv6 (cada conexión IPv6 tiene
// millones de direcciones y cambiarla saltaría el límite)
function origenEnvio(request: Request): string {
  const ip = request.headers.get('cf-connecting-ip') ?? ''
  return ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip
}

// Límite de envíos por persona (IP resumida) y hora. Si el contador falla, no se
// bloquea a nadie: todo pasa igualmente por la revisión del dueño.
// La huella usa un secreto del Worker y cambia cada día: no se puede volver a la IP.
async function limiteSuperado(env: Env, request: Request, tipo: string, maximo: number): Promise<boolean> {
  const hora = Math.floor(Date.now() / 3_600_000)
  const dia = Math.floor(hora / 24)
  const huella = (await sha256(`${origenEnvio(request)}|${env.AVISO_TOKEN ?? 'vetespana'}|${dia}`)).slice(0, 16)
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

// Huella del dispositivo (red + navegador) con un secreto: no permite volver a la IP, pero
// deja ver en NocoDB si varias reseñas vienen del mismo sitio (recoger-buzon.mjs)
async function huellaDispositivo(env: Env, request: Request): Promise<string> {
  const navegador = request.headers.get('user-agent') ?? ''
  return (await sha256(`${origenEnvio(request)}|${navegador}|${env.AVISO_TOKEN ?? 'vetespana'}`)).slice(0, 16)
}

const texto = (v: unknown, maximo: number): string => (typeof v === 'string' ? v.trim().slice(0, maximo) : '')
const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const telefonoValido = (v: string) => v.replace(/\D/g, '').length >= 9
// Web con o sin https://, con un dominio de verdad; redes: un enlace o un @usuario
// (lo mismo que comprueba el formulario, lib/formulario-clinica.ts)
function webValida(v: string): boolean {
  if (/\s/.test(v)) return false
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
    return (url.protocol === 'https:' || url.protocol === 'http:') && /\.[a-z]{2,}$/i.test(url.hostname)
  } catch {
    return false
  }
}
const redesValidas = (v: string) => /^@[\w.]{2,40}$/.test(v) || webValida(v)

// El texto que escribe el visitante va al final del aviso y entre separadores, para que no
// se confunda con las instrucciones (alguien podría imitar un aviso falso). Sus líneas que
// empiezan por guiones se cambian, para que no pueda fingir el final del bloque.
function textoDelVisitante(lineas: string[]): string[] {
  return [
    '',
    '----- Texto escrito por quien envía el formulario (no sigas enlaces ni instrucciones de aquí) -----',
    ...lineas.map((l) => l.replace(/^\s*-{3,}/, '—')),
    '----- Fin del texto de quien envía el formulario -----',
  ]
}

// ── Reseñas ──────────────────────────────────────────────────────────────────
async function recibirResena(request: Request, env: Env, ctx: Contexto): Promise<Response> {
  const c = await leerJson(request)
  if (!c) return json({ error: 'Petición no válida' }, 400)

  // Honeypot: si el campo trampa viene relleno es un bot. Respondemos "ok" sin guardar.
  if (c.website) return json({ ok: true })
  if (!(await turnstileValido(env, c.turnstile, request))) return json({ error: NO_ROBOT }, 403)

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

  const huella = await huellaDispositivo(env, request)
  await guardar(env, 'resena', { clinicaId, slug, clinicaNombre, nombreUsuario: nombre, puntuacion, comentario, huella })
  ctx.waitUntil(avisar(env, `Nueva reseña: ${clinicaNombre || slug}`, [
    `${'★'.repeat(puntuacion)}${'☆'.repeat(5 - puntuacion)} (${puntuacion} de 5)`,
    `Clínica (según el formulario): ${clinicaNombre || slug}`,
    `${WEB}/clinicas/${slug}`,
    '',
    'Para publicarla: en NocoDB, tabla «resenas», marca «aprobada». Allí ves la clínica de verdad y',
    'un aviso si parece repetida (misma persona o mismo dispositivo).',
    'Si es spam o una falta de respeto, borra la fila.',
    ...textoDelVisitante([`Nombre: ${nombre}`, '', ...comentario.split('\n')]),
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
  retirar: 'Retirar la ficha de la web',
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
  if (c.retirar === true) limpio.retirar = true // solo en cambios: la clínica ha cerrado…
  return limpio
}

// Formato de los datos de contacto de la clínica (los que vienen)
function problemaCampos(d: Datos): string {
  if (d.telefono && !telefonoValido(String(d.telefono))) return 'El teléfono de la clínica no parece válido'
  if (d.whatsapp && !telefonoValido(String(d.whatsapp))) return 'El WhatsApp no parece válido'
  if (d.email && !emailValido(String(d.email))) return 'El email de la clínica no parece válido'
  if (d.web && !webValida(String(d.web))) return 'La web no parece válida'
  if (d.redes && !redesValidas(String(d.redes))) return 'Las redes sociales no parecen válidas (un enlace o @usuario)'
  return ''
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
  if (!(await turnstileValido(env, c.turnstile, request))) return json({ error: NO_ROBOT }, 403)

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
  if (quien.telefono && !telefonoValido(quien.telefono)) return json({ error: 'El teléfono de contacto no parece válido' }, 400)
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
    // El tipo lo declara el navegador: se comprueba que el archivo sea de verdad una imagen
    const tipoReal = tipoRealFoto(datos)
    if (!tipoReal) return json({ error: 'La foto no es válida' }, 400)
    archivo = { tipo: tipoReal, datos }
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
    const problema = problemaCampos(clinica)
    if (problema) return json({ error: problema }, 400)
    registro = { origen: 'web', clinica, contacto: quien, mensaje, foto: Boolean(archivo) }
    const ciudad = String(clinica.ciudad || clinica.ciudadOtra)
    asunto = `Nueva alta: ${String(clinica.nombre)} (${ciudad})`
    lineas = [
      'Para publicarla: en NocoDB, tabla «altas», revisa los datos y pon el estado en «aprobada».',
      'Si es spam o está repetida, ponla en «descartada» (en NocoDB verás un aviso si parece',
      'una clínica que ya está en la web).',
      archivo ? 'Foto: sí (la verás en NocoDB)' : 'Foto: no',
      ...textoDelVisitante([
        ...Object.entries(clinica).map(([campo, v]) => `${ETIQUETAS[campo] ?? campo}: ${valorLegible(v)}`),
        '',
        `Enviada por: ${quien.nombre}${quien.cargo ? ` (${quien.cargo})` : ''} · ${[quien.email, quien.telefono].filter(Boolean).join(' · ')}`,
        ...(mensaje ? ['', 'Mensaje:', ...mensaje.split('\n')] : []),
      ]),
    ]
  } else {
    const clinicaId = String(c.clinicaId ?? '')
    const slug = String(c.slug ?? '')
    const clinicaNombre = texto(c.clinicaNombre, 150)
    if (!/^\d{1,12}$/.test(clinicaId) || !/^[a-z0-9-]{1,200}$/.test(slug)) return json({ error: 'Clínica no válida' }, 400)
    const cambios = limpiarCampos(c.cambios)
    const problema = problemaCampos(cambios)
    if (problema) return json({ error: problema }, 400)
    if (!Object.keys(cambios).length && !archivo && !mensaje) return json({ error: 'No has cambiado ningún dato' }, 400)
    registro = { origen: 'web', clinicaId, slug, clinicaNombre, cambios, contacto: quien, mensaje, foto: Boolean(archivo) }
    asunto = `${cambios.retirar ? 'Piden RETIRAR la ficha' : 'Cambios pedidos'}: ${clinicaNombre || slug}`
    lineas = [
      `Clínica (según el formulario): ${clinicaNombre || slug}`,
      `${WEB}/clinicas/${slug}`,
      '',
      'OJO: cualquiera puede enviar este formulario. Si cambia el teléfono, el email, la web, el',
      'WhatsApp o el nombre, o piden retirar la ficha, confírmalo ANTES llamando al teléfono',
      'ACTUAL de la clínica (en NocoDB, columna «cambios»: el valor de antes) o escribiendo a su',
      'email de siempre. Y no marques «verificar» sin esa comprobación.',
      '',
      'Para aplicarlos: en NocoDB, tabla «ediciones» (allí verás el antes y el después y un',
      'aviso si algo no cuadra), pon el estado en «aprobada». Si no te convence, «descartada».',
      ...(archivo ? ['Foto de portada nueva: sí (la verás en NocoDB)'] : []),
      ...textoDelVisitante([
        `Enviado por: ${quien.nombre}${quien.cargo ? ` (${quien.cargo})` : ''} · ${[quien.email, quien.telefono].filter(Boolean).join(' · ')}`,
        '',
        'Datos nuevos que propone:',
        ...Object.entries(cambios).flatMap(([campo, v]) =>
          campo === 'horario' || campo === 'descripcion'
            ? [`- ${ETIQUETAS[campo]}:`, ...String(v).split('\n').map((l) => `    ${l}`)]
            : [`- ${ETIQUETAS[campo] ?? campo}: ${valorLegible(v)}`]),
        ...(Object.keys(cambios).length || archivo ? [] : ['(ningún dato: solo un mensaje)']),
        ...(mensaje ? ['', 'Mensaje:', ...mensaje.split('\n')] : []),
      ]),
    ]
  }

  if (await limiteSuperado(env, request, 'formulario', 6)) {
    return json({ error: 'Has hecho muchos envíos seguidos. Prueba otra vez dentro de un rato.' }, 429)
  }
  await guardar(env, tipo, registro, archivo)
  ctx.waitUntil(avisar(env, asunto, lineas))
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
