import type { Metadata } from 'next'
import Link from '@/components/Enlace'
import { searchClinics } from '@/lib/datos'
import { COMUNIDADES, COMUNIDAD_EMOJI, comunidadDeCiudad, nombreCiudad, nombreComunidad } from '@/types/clinic'
import { MINIMO_CIUDAD_24H, RUTA_URGENCIAS, rutaUrgenciasCiudad, urgenciasPorCiudad } from '@/lib/urgencias'
import { SITIO, jsonLdSeguro, metadatosPagina } from '@/lib/seo'
import ClinicGrid from '@/components/ClinicGrid'

// Página estática con todas las clínicas de urgencias 24 horas de España, por ciudad.
export async function generateMetadata(): Promise<Metadata> {
  const n = (await searchClinics({ urgencias: true })).length
  return metadatosPagina({
    title: 'Veterinarios de urgencias 24 horas en España',
    description: `${n} clínicas y hospitales veterinarios abiertos las 24 horas en España, por ciudad: teléfono, dirección y horario para una urgencia con tu perro o tu gato.`,
    ruta: RUTA_URGENCIAS,
  })
}

const PAGE = 24

export default async function UrgenciasPage() {
  const todas = await searchClinics({ urgencias: true })
  const porCiudad = await urgenciasPorCiudad()
  // Ciudades de cada comunidad con alguna clínica 24 h
  const porComunidad = COMUNIDADES.map((comunidad) => ({
    comunidad,
    ciudades: [...porCiudad.keys()]
      .filter((ciudad) => comunidadDeCiudad(ciudad) === comunidad)
      .sort((a, b) => nombreCiudad(a).localeCompare(nombreCiudad(b), 'es')),
  })).filter((g) => g.ciudades.length)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4 flex flex-wrap gap-1">
        <Link href="/" className="hover:text-teal-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-600">Urgencias 24 horas</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">🚨 Veterinarios de urgencias 24 horas</h1>
      <p className="text-gray-600 max-w-3xl mb-4">
        Estas son las <strong>{todas.length} clínicas y hospitales veterinarios</strong> de VetEspaña que atienden
        urgencias las 24 horas, repartidos en {porCiudad.size} ciudades. En una urgencia, <strong>llama antes de ir</strong>:
        te dirán si pueden atenderte ya y qué hacer mientras llegas.
      </p>
      <div className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="/cerca-de-mi" className="rounded-full bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800">
          📍 Ver las más cercanas a mí
        </Link>
        <Link href="/guias/urgencias-veterinarias-24h" className="rounded-full border border-teal-200 bg-white px-4 py-2 font-medium text-teal-800 hover:bg-teal-50">
          ¿Es una urgencia? Guía rápida
        </Link>
      </div>

      {/* Por ciudad: enlaces a las páginas de urgencias de cada ciudad (o a la ficha, si hay una sola) */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Urgencias veterinarias 24 horas por ciudad</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {porComunidad.map(({ comunidad, ciudades }) => (
            <div key={comunidad}>
              <h3 className="mb-2 font-semibold text-gray-800">
                <span aria-hidden>{COMUNIDAD_EMOJI[comunidad] ?? '📍'} </span>{nombreComunidad(comunidad)}
              </h3>
              <ul className="space-y-1 text-sm">
                {ciudades.map((ciudad) => {
                  const suyas = porCiudad.get(ciudad) ?? []
                  return (
                    <li key={ciudad}>
                      {suyas.length >= MINIMO_CIUDAD_24H ? (
                        <Link href={rutaUrgenciasCiudad(ciudad)} className="text-teal-800 hover:underline">
                          {nombreCiudad(ciudad)} <span className="text-gray-500">({suyas.length})</span>
                        </Link>
                      ) : (
                        <>
                          <span className="text-gray-700">{nombreCiudad(ciudad)}:</span>{' '}
                          <Link href={`/clinicas/${suyas[0].slug}`} className="text-teal-800 hover:underline">{suyas[0].nombre}</Link>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <h2 className="text-lg font-bold text-gray-900 mb-4">Todas las clínicas de urgencias 24 horas</h2>
      <ClinicGrid initial={todas.slice(0, PAGE)} total={todas.length} filtro={{ urgencias: true }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { name: 'Inicio', item: SITIO },
              { name: 'Veterinarios de urgencias 24 horas', item: SITIO + RUTA_URGENCIAS },
            ].map((m, i) => ({ '@type': 'ListItem', position: i + 1, ...m })),
          }),
        }}
      />
    </div>
  )
}
