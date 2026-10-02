import type { Clinic } from '@/tipos/clinica'

// Contenido SEO reutilizable para las páginas de ciudad/comunidad
// (lo usan tanto /clinicas?ciudad= como la ruta limpia /veterinarios/[ciudad]).

// Suma de caracteres del nombre del lugar → elige variante de intro. Así cada
// ciudad tiene un texto distinto (no duplicado), pero estable entre visitas.
function hashLugar(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) % 997
  return h
}

// «1 clínica veterinaria» / «5 clínicas veterinarias»
export function clinicasVeterinarias(n: number): string {
  return n === 1 ? '1 clínica veterinaria' : `${n} clínicas veterinarias`
}

export function textoSeoLugar(lugar: string, count: number, especialidad?: string): string[] {
  if (count === 0) {
    return [
      `Todavía no tenemos ninguna clínica veterinaria listada en ${lugar}.`,
      `Si tienes o conoces una clínica en ${lugar}, puedes añadirla gratis desde «Añade tu clínica». Mientras tanto, puedes consultar las clínicas de otras ciudades de la zona.`,
    ]
  }
  const n = clinicasVeterinarias(count)
  const intros = [
    `¿Buscas un veterinario en ${lugar}? En VetEspaña reunimos ${n} de ${lugar} para que compares y elijas con confianza.`,
    `En ${lugar} encontrarás ${n} en VetEspaña, con toda la información que necesitas para cuidar de tu mascota.`,
    `Hemos reunido ${n} en ${lugar} para ayudarte a encontrar el centro que mejor se adapta a ti y a tu mascota.`,
    `Descubre ${n} en ${lugar}: consulta horarios, especialidades y opiniones antes de decidir.`,
  ]
  const intro = intros[hashLugar(lugar) % intros.length]

  const segundo = especialidad
    ? `Aquí ves los centros de ${lugar} con servicios de ${especialidad.toLowerCase()}. En cada ficha encontrarás el teléfono, la dirección, el horario y las opiniones de otros dueños de mascotas.`
    : `En cada ficha puedes ver el teléfono, la dirección, el horario, las especialidades y, cuando las hay, fotos y reseñas. Las clínicas con urgencias 24 horas aparecen marcadas en el listado; llama o escribe directamente a la que elijas.`

  return [intro, segundo]
}

// Datos reales de la zona a partir de las clínicas (contenido único que posiciona).
export function cityFacts(clinics: Clinic[]): { count24h: number; topEsp: string[] } {
  const count24h = clinics.filter((c) => c.urgencias24h).length
  const espCount = new Map<string, number>()
  for (const c of clinics) {
    for (const e of c.especialidades) {
      if (e === 'Perros' || e === 'Gatos') continue // las dos base no aportan
      espCount.set(e, (espCount.get(e) ?? 0) + 1)
    }
  }
  const topEsp = [...espCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([e]) => e)
  return { count24h, topEsp }
}

export type FaqItem = { q: string; a: string }

// FAQ con datos reales (se muestra y se emite como JSON-LD FAQPage).
export function buildCityFaq(
  lugarDisplay: string,
  total: number,
  count24h: number,
  topEsp: string[],
): FaqItem[] {
  // Sin clínicas no hay nada que responder (ni que declarar a Google)
  if (total === 0) return []
  const faq: FaqItem[] = [
    {
      q: `¿Cuántas clínicas veterinarias hay en ${lugarDisplay}?`,
      a: `En VetEspaña tenemos ${clinicasVeterinarias(total)} en ${lugarDisplay} con su teléfono, dirección, horario y especialidades.`,
    },
    {
      q: `¿Hay veterinarios de urgencias 24h en ${lugarDisplay}?`,
      a:
        count24h > 0
          ? `Sí. En ${lugarDisplay} hay ${clinicasVeterinarias(count24h)} con urgencias 24 horas. Aparecen marcadas con «Urgencias 24h» en el listado.`
          : `De momento no tenemos listada ninguna clínica con urgencias 24h en ${lugarDisplay}. Puedes consultar las clínicas cercanas o las de tu comunidad.`,
    },
  ]
  if (topEsp.length) {
    faq.push({
      q: `¿Qué especialidades veterinarias puedo encontrar en ${lugarDisplay}?`,
      a: `Las clínicas de ${lugarDisplay} ofrecen especialidades como ${topEsp.join(', ')}, además de atención general para perros y gatos.`,
    })
  }
  return faq
}
