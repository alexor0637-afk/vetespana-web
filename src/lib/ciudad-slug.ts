import { CIUDADES_POR_COMUNIDAD } from '@/types/clinic'
import { ciudadSlug } from '@/lib/slug'

// Slug de la ciudad para las URLs (función pura: también en componentes cliente)
export { ciudadSlug }

// Mapa inverso slug → { ciudad (valor de Airtable), comunidad }.
// Se usa en la ruta /veterinarios/[ciudad] para resolver el slug de la URL.
export const CIUDAD_POR_SLUG: Record<string, { ciudad: string; comunidad: string }> = (() => {
  const map: Record<string, { ciudad: string; comunidad: string }> = {}
  for (const [comunidad, ciudades] of Object.entries(CIUDADES_POR_COMUNIDAD)) {
    for (const ciudad of ciudades) {
      map[ciudadSlug(ciudad)] = { ciudad, comunidad }
    }
  }
  return map
})()
