import type { MetadataRoute } from 'next'

// Se genera en el build como archivo estático (robots.txt).
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Buzón de reseñas/altas (solo POST): no hay nada que indexar
      disallow: '/api/',
    },
    sitemap: 'https://www.vetespana.es/sitemap.xml',
  }
}
