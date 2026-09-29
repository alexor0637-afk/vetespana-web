import type { Metadata } from 'next'
import Link from '@/components/Enlace'
import { notFound } from 'next/navigation'
import { searchClinics } from '@/lib/datos'
import { CIUDAD_DISPLAY } from '@/types/clinic'
import { CIUDAD_POR_SLUG, ciudadSlug } from '@/lib/ciudad-slug'
import { cityFacts, clinicasVeterinarias } from '@/lib/city-content'
import { SITIO, jsonLdSeguro, metadatosPagina } from '@/lib/seo'
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

  return metadatosPagina({
    title: `Veterinarios en ${display}${n ? `: ${clinicasVeterinarias(n)}` : ''}`,
    description: n
      ? `${clinicasVeterinarias(n)} en ${display}: veterinario cercano, urgencias 24h, especialidades, horarios, teléfono y reseñas. Encuentra tu clínica de confianza.`
      : `Clínicas veterinarias en ${display}: todavía no tenemos ninguna listada. Consulta las de ${entry.comunidad} o añade tu clínica gratis.`,
    ruta: `/veterinarios/${slug}`,
    // Sin clínicas es una página vacía: fuera de Google (y del sitemap) hasta que tenga alguna
    indexar: n > 0,
  })
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

      {/* Todas las clínicas de la ciudad también como enlaces en el HTML: las que no caben
          en la primera tanda solo salían con «Ver más» (JavaScript) y Google no las veía */}
      {filtradas.length > PAGE && (
        <nav aria-label={`Todas las clínicas veterinarias en ${display}`} className="mt-10">
          <h2 className="text-base font-semibold text-gray-700 mb-3">Todas las clínicas veterinarias en {display}</h2>
          <ul className="columns-1 sm:columns-2 lg:columns-3 gap-6 text-sm">
            {filtradas.map((c) => (
              <li key={c.id} className="mb-1.5 break-inside-avoid">
                <Link href={`/clinicas/${c.slug}`} className="text-gray-600 hover:text-teal-600 hover:underline">
                  {c.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <CitySeoContent
        lugarDisplay={display}
        total={filtradas.length}
        count24h={count24h}
        topEsp={topEsp}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { name: 'Inicio', item: SITIO },
              { name: comunidad, item: SITIO + urlComunidad },
              { name: `Veterinarios en ${display}`, item: `${SITIO}/veterinarios/${slug}` },
            ].map((m, i) => ({ '@type': 'ListItem', position: i + 1, ...m })),
          }),
        }}
      />
    </div>
  )
}
