import type { Metadata } from 'next'

export const SITIO = 'https://www.vetespana.es'

// Imagen general para redes (app/opengraph-image.tsx). Hay que ponerla en cada página
// que define su propio openGraph: el de la página sustituye ENTERO al del layout.
const IMAGEN_REDES = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'VetEspaña — Encuentra tu veterinario de confianza en España',
}

interface DatosPagina {
  title: string
  description: string
  /** Ruta de la página, p. ej. /veterinarios/madrid */
  ruta: string
  /** Foto propia para redes; si no hay, la imagen general de VetEspaña */
  imagen?: { url: string; alt: string }
  /** false → Google no la indexa (páginas vacías) */
  indexar?: boolean
  tipo?: 'website' | 'article'
}

// Metadatos de una página: título, descripción, canonical y lo que se ve al compartirla
// en WhatsApp, Facebook o X. Sin openGraph propio, la página heredaría el título y la
// URL de la portada (así estaba: al compartir una ciudad salía la portada).
export function metadatosPagina({ title, description, ruta, imagen, indexar = true, tipo = 'website' }: DatosPagina): Metadata {
  const url = SITIO + ruta
  const foto = imagen ?? IMAGEN_REDES
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: tipo, locale: 'es_ES', siteName: 'VetEspaña', title, description, url, images: [foto] },
    twitter: { card: 'summary_large_image', title, description, images: [foto.url] },
    ...(indexar ? {} : { robots: { index: false, follow: true } }),
  }
}

// Datos estructurados (JSON-LD) dentro de <script>: se escapa «<» para que un texto con
// «</script>» (p. ej. un nombre enviado por un formulario) no pueda cerrar la etiqueta
// y meter código en la página.
export function jsonLdSeguro(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, '\\u003c')
}
