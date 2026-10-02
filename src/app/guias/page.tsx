import type { Metadata } from 'next'
import Link from '@/componentes/estructura/Enlace'
import Image from 'next/image'
import { GUIAS } from '@/datos/guias'
import { clinicasMasDe } from '@/utilidades/base-de-datos'
import { metadatosPagina } from '@/utilidades/seo'

export const metadata: Metadata = metadatosPagina({
  title: 'Guías para dueños de mascotas',
  description:
    'Guías prácticas sobre el cuidado de tu mascota: cómo elegir veterinario, urgencias 24h, calendario de vacunas y precios. Consejos claros y de confianza.',
  ruta: '/guias',
})

export default async function GuiasPage() {
  const masDe = await clinicasMasDe()
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-teal-600">Inicio</Link> <span className="mx-1">/</span>{' '}
        <span className="text-gray-700">Guías</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Guías para dueños de mascotas</h1>
      <p className="text-gray-600 max-w-2xl mb-8">
        Consejos claros y prácticos para cuidar mejor de tu perro, gato o mascota: cómo elegir
        clínica, qué hacer en una urgencia, vacunas y precios. Y cuando lo necesites,{' '}
        <Link href="/clinicas" className="text-teal-700 font-medium hover:underline">
          encuentra tu veterinario
        </Link>{' '}
        en nuestro directorio.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {GUIAS.map((g) => (
          <Link
            key={g.slug}
            href={`/guias/${g.slug}`}
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-teal-200 transition-all"
          >
            <div className="relative h-40">
              <Image
                src={g.heroImg}
                alt={g.heroAlt}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute bottom-2 left-3 text-3xl drop-shadow-md">{g.emoji}</span>
            </div>
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">{g.titulo}</h2>
              <p className="text-sm text-gray-600 mb-3">{g.resumen}</p>
              <span className="text-sm font-semibold text-teal-700">Leer guía →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 bg-teal-50/60 rounded-2xl border border-teal-100 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">¿Buscas veterinario?</h2>
        <p className="text-gray-600 mb-4">
          Más de {masDe} clínicas veterinarias en toda España, con horarios, especialidades y urgencias 24h.
        </p>
        <Link
          href="/clinicas"
          className="inline-block bg-teal-700 text-white font-semibold px-6 py-3 rounded-full hover:bg-teal-800 transition-colors"
        >
          Buscar clínicas veterinarias
        </Link>
      </div>
    </div>
  )
}
