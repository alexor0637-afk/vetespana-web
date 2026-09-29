import type { Metadata } from 'next'
import Link from '@/components/Enlace'

// Título propio y fuera de Google (antes heredaba el título y la canonical de la portada)
export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-6xl mb-4">🐾</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
      <p className="text-gray-500 mb-6">Parece que esta página se ha escapado como un gato asustado.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/clinicas"
          className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
        >
          Buscar clínicas
        </Link>
        <Link
          href="/cerca-de-mi"
          className="bg-white border border-gray-200 hover:border-teal-300 text-gray-700 font-semibold px-6 py-2.5 rounded-full transition-colors"
        >
          Veterinario cerca de mí
        </Link>
        <Link
          href="/"
          className="bg-white border border-gray-200 hover:border-teal-300 text-gray-700 font-semibold px-6 py-2.5 rounded-full transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
