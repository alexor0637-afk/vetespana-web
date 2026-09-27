import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { searchClinics } from '@/lib/datos'
import { CIUDADES_POR_COMUNIDAD, CIUDAD_DISPLAY, COMUNIDADES, COMUNIDAD_EMOJI } from '@/types/clinic'
import { ciudadSlug } from '@/lib/ciudad-slug'
import { cityFacts } from '@/lib/city-content'
import ClinicGrid from '@/components/ClinicGrid'
import SearchBar from '@/components/SearchBar'
import CitySeoContent from '@/components/CitySeoContent'

// Página de comunidad autónoma (URL limpia; sustituye a /clinicas?comunidad=).
// Se genera en el build una por comunidad.
export const dynamicParams = false

const COMUNIDAD_POR_SLUG = Object.fromEntries(COMUNIDADES.map((c) => [ciudadSlug(c), c]))

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return Object.keys(COMUNIDAD_POR_SLUG).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const comunidad = COMUNIDAD_POR_SLUG[slug]
  if (!comunidad) return {}
  const n = (await searchClinics({ comunidad })).length
  return {
    title: `Veterinarios en ${comunidad}: ${n} clínicas veterinarias`,
    description: `${n} clínicas veterinarias en ${comunidad}: busca por ciudad, urgencias 24h y especialidades. Teléfono, horario, dirección y reseñas de cada clínica.`,
    alternates: { canonical: `https://www.vetespana.es/comunidades/${slug}` },
  }
}

export default async function ComunidadPage({ params }: Props) {
  const { slug } = await params
  const comunidad = COMUNIDAD_POR_SLUG[slug]
  if (!comunidad) notFound()

  const filtradas = await searchClinics({ comunidad })
  const PAGE = 24
  const { count24h, topEsp } = cityFacts(filtradas)
  const ciudades = [...(CIUDADES_POR_COMUNIDAD[comunidad] ?? [])].sort((a, b) =>
    (CIUDAD_DISPLAY[a] ?? a).localeCompare(CIUDAD_DISPLAY[b] ?? b, 'es')
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-400 mb-4 flex flex-wrap gap-1">
        <Link href="/clinicas" className="hover:text-teal-600">
          Clínicas
        </Link>
        <span>/</span>
        <span className="text-gray-600">{comunidad}</span>
      </nav>

      <div className="mb-6">
        <SearchBar />
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <h1 className="text-2xl font-bold text-gray-900">
          <span aria-hidden>{COMUNIDAD_EMOJI[comunidad] ?? '📍'} </span>Veterinarios en {comunidad}
        </h1>
        <span className="text-sm text-gray-500">
          {filtradas.length} clínica{filtradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Ciudades de la comunidad: enlaces internos a las páginas de ciudad */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-8 text-sm">
        {ciudades.map((ciudad) => (
          <Link key={ciudad} href={`/veterinarios/${ciudadSlug(ciudad)}`} className="text-gray-600 hover:text-teal-600 hover:underline">
            {CIUDAD_DISPLAY[ciudad] ?? ciudad}
          </Link>
        ))}
      </div>

      {filtradas.length > 0 ? (
        <ClinicGrid initial={filtradas.slice(0, PAGE)} total={filtradas.length} filtro={{ comunidad }} />
      ) : (
        <p className="text-center py-20 text-gray-500">Aún no hay clínicas listadas en {comunidad}.</p>
      )}

      <CitySeoContent lugarDisplay={comunidad} total={filtradas.length} count24h={count24h} topEsp={topEsp} />
    </div>
  )
}
