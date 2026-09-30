// Horario de hoy y «abierto ahora» a partir del horario guardado, una línea por día:
//   «lunes: 9:30–14:00, 16:30–20:00» · «sábado: Cerrado» · «domingo: Abierto 24 horas»
// Si el horario no sigue ese formato (texto libre), no se dice nada.

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const sinTildes = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const TRAMO = /(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/g

export interface Hoy {
  /** Lo que pone el horario para hoy («9:30–14:00, 16:30–20:00», «Cerrado»…) */
  texto: string
  abierto: boolean
}

// Día de la semana (0 = lunes) y minuto del día en la hora de la clínica
function ahora(fecha: Date, canarias: boolean): { dia: number; minuto: number } {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: canarias ? 'Atlantic/Canary' : 'Europe/Madrid',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha)
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? ''
  const dia = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(valor('weekday'))
  return { dia, minuto: Number(valor('hour')) * 60 + Number(valor('minute')) }
}

export function horarioDeHoy(horario: string | undefined, fecha: Date, canarias = false): Hoy | null {
  const porDia = new Map<number, string>()
  for (const linea of (horario ?? '').split('\n')) {
    const m = linea.match(/^\s*([^:]+):\s*(.+)$/)
    const dia = m ? DIAS.indexOf(sinTildes(m[1].trim())) : -1
    if (dia >= 0) porDia.set(dia, m![2].trim())
  }
  if (porDia.size !== 7) return null
  const { dia, minuto } = ahora(fecha, canarias)
  const texto = porDia.get(dia)
  if (dia < 0 || !texto) return null
  if (/^cerrado$/i.test(texto)) return { texto: 'Cerrado', abierto: false }
  if (/24 horas/i.test(texto)) return { texto: 'Abierto 24 horas', abierto: true }
  const tramos = [...texto.matchAll(TRAMO)].map((t) => [Number(t[1]) * 60 + Number(t[2]), Number(t[3]) * 60 + Number(t[4])])
  if (!tramos.length) return null
  // Un tramo que pasa de medianoche (20:00–2:00) cuenta desde la apertura hasta el final del día
  const abierto = tramos.some(([a, c]) => (c > a ? minuto >= a && minuto < c : minuto >= a))
  return { texto, abierto }
}
