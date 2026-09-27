import Link from '@/components/Enlace'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-6xl mb-4">🐾</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
      <p className="text-gray-500 mb-6">Parece que esta página se ha escapado como un gato asustado.</p>
      <Link
        href="/"
        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
