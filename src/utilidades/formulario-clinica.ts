// Utilidades del formulario de alta y de cambios de una clínica
// (componentes/formularios/FormularioClinica.tsx y componentes/formularios/EditorHorario.tsx).

/** Buzón de Cloudflare que recibe reseñas, altas y cambios (cloudflare/buzon/index.ts) */
export const URL_BUZON = process.env.NEXT_PUBLIC_URL_BUZON ?? 'https://buzon.vetespana.es'

// Clave pública del widget anti-robots de Cloudflare Turnstile («VetEspaña formularios»,
// para vetespana.es y www). La clave secreta es un secreto del Worker (TURNSTILE_SECRET).
export const TURNSTILE_SITEKEY = '0x4AAAAAAFJ_ln6ULfKHZEPj'

export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const

export type ModoDia = 'abierto' | 'cerrado' | '24h'
export interface DiaHorario {
  modo: ModoDia
  /** Tramos [apertura, cierre] en "HH:MM" (24:00 vale como cierre a medianoche) */
  tramos: [string, string][]
}

/** Horario de partida de una clínica nueva (se ve y se cambia en el formulario) */
export function horarioTipico(): DiaHorario[] {
  return DIAS.map((dia) => {
    if (dia === 'domingo') return { modo: 'cerrado', tramos: [['10:00', '14:00']] }
    if (dia === 'sábado') return { modo: 'abierto', tramos: [['10:00', '14:00']] }
    return { modo: 'abierto', tramos: [['09:30', '14:00'], ['16:30', '20:00']] }
  })
}

const sinCeroDelante = (hora: string) => hora.replace(/^0(\d)/, '$1')

const minutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

/** Qué falla en el horario (un tramo al revés o dos que se pisan), o '' si está bien */
export function problemaHorario(dias: DiaHorario[]): string {
  for (const [i, d] of dias.entries()) {
    if (d.modo !== 'abierto') continue
    const tramos = d.tramos
      .filter(([a, b]) => a && b)
      .map(([a, b]) => [minutos(a), minutos(b)] as const)
      .sort((x, y) => x[0] - y[0])
    for (const [k, [apertura, cierre]] of tramos.entries()) {
      if (cierre <= apertura) {
        return `Revisa el ${DIAS[i]}: la hora de cierre tiene que ser posterior a la de apertura (si abrís de noche, elige «24 horas» o parte el horario en dos tramos).`
      }
      if (k > 0 && apertura < tramos[k - 1][1]) return `Revisa el ${DIAS[i]}: hay dos tramos que se solapan.`
    }
  }
  return ''
}

/** Web: con o sin https://, con un dominio de verdad */
export function webValida(v: string): boolean {
  if (/\s/.test(v)) return false
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
    return (url.protocol === 'https:' || url.protocol === 'http:') && /\.[a-z]{2,}$/i.test(url.hostname)
  } catch {
    return false
  }
}

/** Redes: un enlace o un usuario tipo @clinica */
export const redesValidas = (v: string) => /^@[\w.]{2,40}$/.test(v) || webValida(v)

/** Al formato que ya usa la base: "lunes: 9:30–14:00, 16:30–20:00" · "domingo: Cerrado" */
export function horarioATexto(dias: DiaHorario[]): string {
  return dias
    .map((d, i) => {
      let valor = 'Cerrado'
      if (d.modo === '24h') valor = 'Abierto 24 horas'
      else if (d.modo === 'abierto') {
        const tramos = d.tramos.filter(([a, b]) => a && b)
        if (tramos.length) valor = tramos.map(([a, b]) => `${sinCeroDelante(a)}–${sinCeroDelante(b)}`).join(', ')
      }
      return `${DIAS[i]}: ${valor}`
    })
    .join('\n')
}

const sinTildes = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Lee un horario guardado. Si no tiene los 7 días en el formato de siempre, null. */
export function textoAHorario(texto?: string): DiaHorario[] | null {
  if (!texto) return null
  const porDia = new Map<string, string>()
  for (const linea of texto.split('\n')) {
    const m = linea.match(/^\s*([a-záéíóúñ]+)\s*:\s*(.+)$/i)
    if (m) porDia.set(sinTildes(m[1]), m[2].trim())
  }
  const dias: DiaHorario[] = []
  for (const dia of DIAS) {
    const valor = porDia.get(sinTildes(dia))
    if (valor === undefined) return null
    if (/cerrado/i.test(valor)) {
      dias.push({ modo: 'cerrado', tramos: [['09:30', '20:00']] })
    } else if (/24\s*horas/i.test(valor)) {
      dias.push({ modo: '24h', tramos: [['09:30', '20:00']] })
    } else {
      const tramos = [...valor.matchAll(/(\d{1,2})[:.](\d{2})\s*[–-]\s*(\d{1,2})[:.](\d{2})/g)]
        .map((t): [string, string] => [`${t[1].padStart(2, '0')}:${t[2]}`, `${t[3].padStart(2, '0')}:${t[4]}`])
      if (!tramos.length) return null
      dias.push({ modo: 'abierto', tramos: tramos.slice(0, 3) })
    }
  }
  return dias
}

/** Reduce la foto en el navegador (lado mayor ≤ 1600 px, JPEG) para que el envío sea ligero */
export async function reducirFoto(archivo: File): Promise<{ datos: string; tipo: 'image/jpeg'; kb: number }> {
  let imagen: ImageBitmap
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('No hemos podido abrir esa imagen. Prueba con una foto JPG o PNG.')
  }
  let lado = 1600
  let calidad = 0.82
  for (let intento = 0; intento < 5; intento++) {
    const escala = Math.min(1, lado / Math.max(imagen.width, imagen.height))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(imagen.width * escala)
    lienzo.height = Math.round(imagen.height * escala)
    const ctx = lienzo.getContext('2d')
    if (!ctx) break
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, lienzo.width, lienzo.height)
    ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
    const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, 'image/jpeg', calidad))
    if (blob && blob.size <= 1_100_000) {
      return { datos: await aBase64(blob), tipo: 'image/jpeg', kb: Math.round(blob.size / 1024) }
    }
    lado = Math.round(lado * 0.8)
    calidad -= 0.07
  }
  throw new Error('La foto es demasiado grande. Prueba con otra.')
}

async function aBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binario = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binario)
}
