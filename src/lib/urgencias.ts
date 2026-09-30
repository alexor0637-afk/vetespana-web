import type { Clinic } from '@/types/clinic'
import { nombreCiudad } from '@/types/clinic'
import { searchClinics } from '@/lib/datos'
import { ciudadSlug } from '@/lib/ciudad-slug'

// Páginas de urgencias 24 horas («veterinario de urgencias 24h en {ciudad}» es de las
// búsquedas con más intención): una para toda España y una por ciudad con al menos
// MINIMO_CIUDAD_24H clínicas de 24 h (con una sola, la página de la ciudad ya lo dice y
// esta quedaría casi vacía).
export const MINIMO_CIUDAD_24H = 2
export const RUTA_URGENCIAS = '/urgencias-veterinarias-24h'
export const rutaUrgenciasCiudad = (ciudad: string) => `/veterinarios/${ciudadSlug(ciudad)}/urgencias-24h`

/** Clínicas de urgencias 24 h, cada ciudad con las suyas (en el orden del listado) */
export async function urgenciasPorCiudad(): Promise<Map<string, Clinic[]>> {
  const porCiudad = new Map<string, Clinic[]>()
  for (const c of await searchClinics({ urgencias: true })) porCiudad.set(c.ciudad, [...(porCiudad.get(c.ciudad) ?? []), c])
  return porCiudad
}

/** Ciudades con página propia de urgencias 24 h, por orden alfabético */
export async function ciudadesConPaginaUrgencias(): Promise<string[]> {
  return [...(await urgenciasPorCiudad())]
    .filter(([, clinicas]) => clinicas.length >= MINIMO_CIUDAD_24H)
    .map(([ciudad]) => ciudad)
    .sort((a, b) => nombreCiudad(a).localeCompare(nombreCiudad(b), 'es'))
}
