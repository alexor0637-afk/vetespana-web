import type { MetadataRoute } from 'next'
import { getAllClinics } from '@/lib/datos'
import { CIUDADES_POR_COMUNIDAD, COMUNIDADES } from '@/types/clinic'
import { ciudadSlug } from '@/lib/ciudad-slug'
import { GUIAS } from '@/data/guias'

// Se genera en el build como archivo estático (sitemap.xml).
export const dynamic = 'force-static'

// Fecha de la última actualización significativa del contenido general (páginas
// de ciudad, comunidad y estáticas). Las fichas usan su propia fecha real de
// modificación en la base. IMPORTANTE: fecha FIJA, no `new Date()`: si cada
// generación dijera "modificada ahora", Google acaba ignorando la señal lastmod.
// → Al cambiar contenido general (ciudades, textos…), sube esta fecha.
const CONTENIDO_ACTUALIZADO = new Date('2026-09-29')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.vetespana.es'

  // Páginas estáticas principales
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: CONTENIDO_ACTUALIZADO, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/clinicas`, lastModified: CONTENIDO_ACTUALIZADO, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/cerca-de-mi`, lastModified: CONTENIDO_ACTUALIZADO, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/alta-clinica`, lastModified: CONTENIDO_ACTUALIZADO, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/guias`, lastModified: CONTENIDO_ACTUALIZADO, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/ciudades`, lastModified: CONTENIDO_ACTUALIZADO, changeFrequency: 'weekly', priority: 0.7 },
  ]

  // Guías informacionales — cada una con su fecha real de actualización
  const guiaPages: MetadataRoute.Sitemap = GUIAS.map((g) => ({
    url: `${baseUrl}/guias/${g.slug}`,
    lastModified: new Date(g.actualizado),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Una URL limpia por comunidad autónoma
  const comunidadPages: MetadataRoute.Sitemap = COMUNIDADES.map((comunidad) => ({
    url: `${baseUrl}/comunidades/${ciudadSlug(comunidad)}`,
    lastModified: CONTENIDO_ACTUALIZADO,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  const clinicas = await getAllClinics()

  // Una URL por ciudad — el mayor activo de SEO local ("veterinario en {ciudad}").
  // Las ciudades sin clínicas quedan fuera: son páginas vacías (y llevan noindex).
  const ciudadesConClinicas = new Set(clinicas.map((c) => c.ciudad))
  const ciudadPages: MetadataRoute.Sitemap = Object.values(CIUDADES_POR_COMUNIDAD)
    .flat()
    .filter((ciudad) => ciudadesConClinicas.has(ciudad))
    .map((ciudad) => ({
      url: `${baseUrl}/veterinarios/${ciudadSlug(ciudad)}`,
      lastModified: CONTENIDO_ACTUALIZADO,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // Fichas individuales — el grueso del valor SEO, con su fecha real de modificación
  const clinicPages: MetadataRoute.Sitemap = clinicas.map((c) => ({
    url: `${baseUrl}/clinicas/${c.slug}`,
    lastModified: c.actualizado ? new Date(c.actualizado) : CONTENIDO_ACTUALIZADO,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // NOTA: las combinaciones de filtros de /clinicas (?especialidad=, ?q=…) se excluyen
  // a propósito: se calculan en el navegador y comparten el HTML de /clinicas.
  return [...staticPages, ...guiaPages, ...comunidadPages, ...ciudadPages, ...clinicPages]
}
