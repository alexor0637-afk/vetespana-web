import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Web estática: `next build` genera la carpeta out/ con todas las páginas en HTML
  // (datos leídos de Postgres durante el build) y se publica en Cloudflare.
  output: 'export',
  images: {
    // Sin optimizador de imágenes (no hay servidor): las fotos se sirven tal cual
    // desde /fotos/ (copiadas a out/fotos/ al publicar).
    unoptimized: true,
  },
}

export default nextConfig
