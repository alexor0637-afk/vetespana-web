import type { Metadata } from 'next'
import Link from '@/components/Enlace'
import { notFound } from 'next/navigation'
import { searchClinics } from '@/lib/datos'
import { nombreCiudad, nombreComunidad } from '@/types/clinic'
import { CIUDAD_POR_SLUG, ciudadSlug } from '@/lib/ciudad-slug'
import { RUTA_URGENCIAS, ciudadesConPaginaUrgencias, rutaUrgenciasCiudad } from '@/lib/urgencias'
import { SITIO, jsonLdSeguro, metadatosPagina } from '@/lib/seo'
import ClinicGrid from '@/components/ClinicGrid'

// «Veterinario de urgencias 24h en {ciudad}»: solo para las ciudades con al menos dos
// clínicas de 24 h (lib/urgencias.ts). Las demás no tienen esta página.
export const dynamicParams = false

interface Props {
  params: Promise<{ ciudad: string }>
}

export async function generateStaticParams() {
  return (await ciudadesConPaginaUrgencias()).map((ciudad) => ({ ciudad: ciudadSlug(ciudad) }))
}

const lista = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad: slug } = await params
  const entry = CIUDAD_POR_SLUG[slug]
  if (!entry) return {}
  const n = (await searchClinics({ ciudad: entry.ciudad, urgencias: true })).length
  const display = nombreCiudad(entry.ciudad)
  return metadatosPagina({
    title: `Veterinario de urgencias 24 horas en ${display}`,
    description: `${n} clínicas veterinarias de ${display} atienden urgencias las 24 horas: teléfono, dirección y horario. En una urgencia, llama antes de ir.`,
    ruta: rutaUrgenciasCiudad(entry.ciudad),
  })
}

export default async function UrgenciasCiudadPage({ params }: Props) {
  const { ciudad: slug } = await params
  const entry = CIUDAD_POR_SLUG[slug]
  if (!entry) notFound()
  const { ciudad, comunidad } = entry
  const display = nombreCiudad(ciudad)
  const clinicas = await searchClinics({ ciudad, urgencias: true })
  if (!clinicas.length) notFound()
  const total = (await searchClinics({ ciudad })).length
  const urlCiudad = `/veterinarios/${slug}`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4 flex flex-wrap gap-1">
        <Link href={`/comunidades/${ciudadSlug(comunidad)}`} className="hover:text-teal-600">{nombreComunidad(comunidad)}</Link>
        <span>/</span>
        <Link href={urlCiudad} className="hover:text-teal-600">{display}</Link>
        <span>/</span>
        <span className="text-gray-600">Urgencias 24 horas</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">🚨 Veterinarios de urgencias 24 horas en {display}</h1>
      <p className="text-gray-600 max-w-3xl mb-4">
        En {display} hay <strong>{clinicas.length} clínicas veterinarias que atienden urgencias las 24 horas</strong>:{' '}
        {lista(clinicas.map((c) => c.nombre))}. <strong>Llama antes de ir</strong>: te dirán si pueden atenderte en ese
        momento y qué hacer mientras llegas.
      </p>
      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href={urlCiudad} className="rounded-full border border-teal-200 bg-white px-4 py-2 font-medium text-teal-800 hover:bg-teal-50">
          Todas las clínicas de {display} ({total})
        </Link>
        <Link href={RUTA_URGENCIAS} className="rounded-full border border-teal-200 bg-white px-4 py-2 font-medium text-teal-800 hover:bg-teal-50">
          Urgencias 24 horas en otras ciudades
        </Link>
        <Link href="/guias/urgencias-veterinarias-24h" className="rounded-full border border-teal-200 bg-white px-4 py-2 font-medium text-teal-800 hover:bg-teal-50">
          ¿Es una urgencia? Guía rápida
        </Link>
      </div>

      <ClinicGrid initial={clinicas.slice(0, 24)} total={clinicas.length} filtro={{ ciudad, urgencias: true }} />

      <section className="mt-12 max-w-3xl space-y-3 text-gray-700">
        <h2 className="text-lg font-bold text-gray-900">Qué hacer ante una urgencia veterinaria en {display}</h2>
        <p>
          Si tu perro o tu gato tiene dificultad para respirar, sangra mucho, ha comido algo tóxico, ha sufrido un golpe
          fuerte o tiene convulsiones, llama a una de estas clínicas y ve cuanto antes. Lleva, si puedes, el envase de lo
          que haya comido y su cartilla veterinaria.
        </p>
        <p>
          Los horarios y teléfonos salen de la información pública de cada clínica: si algo no cuadra, avísanos desde su
          ficha. Si estás lejos de {display}, mira las <Link href="/cerca-de-mi" className="text-teal-700 underline">clínicas más cercanas a ti</Link>.
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { name: 'Inicio', item: SITIO },
              { name: `Veterinarios en ${display}`, item: SITIO + urlCiudad },
              { name: `Urgencias 24 horas en ${display}`, item: SITIO + rutaUrgenciasCiudad(ciudad) },
            ].map((m, i) => ({ '@type': 'ListItem', position: i + 1, ...m })),
          }),
        }}
      />
    </div>
  )
}
