// Horario de la ficha → datos estructurados para Google (OpeningHoursSpecification).
// El horario se guarda una línea por día, con el formato de Google:
//   «lunes: 9:00–14:00, 16:30–20:00» · «sábado: Cerrado» · «domingo: Abierto 24 horas»
// Si alguna línea no sigue ese formato (texto libre escrito por una clínica), no se
// declara ningún horario: es mejor no dar el dato a Google que darle uno equivocado.

export interface HorarioSchema {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string
  opens: string
  closes: string
}

const DIAS: Record<string, string> = {
  lunes: 'Monday', martes: 'Tuesday', miercoles: 'Wednesday', jueves: 'Thursday',
  viernes: 'Friday', sabado: 'Saturday', domingo: 'Sunday',
}

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

const TRAMO = /(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/g
const SOLO_TRAMOS = /^\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2}(\s*,\s*\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2})*$/

const hora = (h: string, m: string) => `${h.padStart(2, '0')}:${m}`

export function horarioSchema(horario: string | null | undefined): HorarioSchema[] {
  const tramos: HorarioSchema[] = []
  for (const linea of (horario ?? '').split('\n').map((l) => l.trim()).filter(Boolean)) {
    const m = linea.match(/^([^:]+):\s*(.+)$/)
    const dia = m ? DIAS[sinTildes(m[1].trim().toLowerCase())] : undefined
    if (!m || !dia) return [] // línea que no es «día: …» → horario escrito a mano
    const resto = m[2].trim()
    if (/^cerrado$/i.test(resto)) continue // día sin tramos = cerrado
    if (/^abierto 24 horas$/i.test(resto)) {
      tramos.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: dia, opens: '00:00', closes: '23:59' })
      continue
    }
    if (!SOLO_TRAMOS.test(resto)) return []
    for (const t of resto.matchAll(TRAMO)) {
      // Si cierra después de medianoche (20:00–2:00), Google lo entiende con closes < opens
      const closes = t[3] === '24' && t[4] === '00' ? '23:59' : hora(t[3], t[4])
      tramos.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: dia, opens: hora(t[1], t[2]), closes })
    }
  }
  return tramos
}
