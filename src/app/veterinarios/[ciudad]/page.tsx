import type { Metadata } from 'next'
import Link from '@/components/Enlace'
import { notFound } from 'next/navigation'
import { searchClinics } from '@/lib/datos'
import { CIUDAD_DISPLAY } from '@/types/clinic'
import { CIUDAD_POR_SLUG, ciudadSlug } from '@/lib/ciudad-slug'
import { cityFacts } from '@/lib/city-content'
import ClinicGrid from '@/components/ClinicGrid'
import SearchBar from '@/components/SearchBar'
import CitySeoContent from '@/components/CitySeoContent'

// URL limpia de ciudad: el activo de SEO local ("veterinario en {ciudad}").
// Se genera en el build una página por ciudad.
export const dynamicParams = false

interface Props {
  params: Promise<{ ciudad: string }>
}

export function generateStaticParams() {
  return Object.keys(CIUDAD_POR_SLUG).map((ciudad) => ({ ciudad }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad: slug } = await params
  const entry = CIUDAD_POR_SLUG[slug]
  if (!entry) return {}

  const display = CIUDAD_DISPLAY[entry.ciudad] ?? entry.ciudad
  const n = (await searchClinics({ ciudad: entry.ciudad })).length

  return {
    title: `Veterinarios en ${display}${n ? `: ${n} clínicas veterinarias` : ''}`,
    description: `${n || 'Las mejores'} clínicas veterinarias en ${display}: veterinario cercano, urgencias 24h, especialidades, horarios, teléfono y reseñas. Encuentra tu clínica de confianza.`,
    alternates: { canonical: `https://www.vetespana.es/veterinarios/${slug}` },
  }
}

export default async function VeterinariosCiudadPage({ params }: Props) {
  const { ciudad: slug } = await params
  const entry = CIUDAD_POR_SLUG[slug]
  if (!entry) notFound()

  const { ciudad, comunidad } = entry
  const display = CIUDAD_DISPLAY[ciudad] ?? ciudad
  const urlComunidad = `/comunidades/${ciudadSlug(comunidad)}`

  const filtradas = await searchClinics({ ciudad })
  const PAGE = 24
  const { count24h, topEsp } = cityFacts(filtradas)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Migas: ayuda al usuario y reparte enlaces internos */}
      <nav className="text-sm text-gray-400 mb-4 flex flex-wrap gap-1">
        <Link href="/clinicas" className="hover:text-teal-600">
          Clínicas
        </Link>
        <span>/</span>
        <Link href={urlComunidad} className="hover:text-teal-600">
          {comunidad}
        </Link>
        <span>/</span>
        <span className="text-gray-600">{display}</span>
      </nav>

      {/* Búsqueda */}
      <div className="mb-6">
        <SearchBar initialCiudad={ciudad} />
      </div>

      {/* Título SEO orientado a "veterinarios en {ciudad}" */}
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Veterinarios en {display}</h1>
        <span className="text-sm text-gray-500">
          {filtradas.length} clínica{filtradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtradas.length > 0 ? (
        <ClinicGrid initial={filtradas.slice(0, PAGE)} total={filtradas.length} filtro={{ ciudad }} />
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium text-gray-600 mb-2">Aún no hay clínicas listadas en {display}</p>
          <p className="text-sm">
            Mira las{' '}
            <Link href={urlComunidad} className="text-teal-600 underline">
              clínicas de {comunidad}
            </Link>{' '}
            o las <Link href="/cerca-de-mi" className="text-teal-600 underline">más cercanas</Link>.
          </p>
        </div>
      )}

      <CitySeoContent
        lugarDisplay={display}
        total={filtradas.length}
        count24h={count24h}
        topEsp={topEsp}
      />
    </div>
  )
}
