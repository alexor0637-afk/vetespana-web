import type { Metadata } from 'next'
import Link from '@/componentes/estructura/Enlace'
import { CIUDADES_POR_COMUNIDAD, CIUDAD_DISPLAY, COMUNIDAD_EMOJI, nombreComunidad } from '@/tipos/clinica'
import { ciudadSlug } from '@/utilidades/ciudad-slug'
import { getAllClinics } from '@/utilidades/base-de-datos'
import { metadatosPagina } from '@/utilidades/seo'
import Buscador from '@/componentes/busqueda/Buscador'

// Índice navegable de las ciudades que tienen clínicas (las vacías no se enlazan:
// llevan noindex). Reparte enlaces internos a las páginas de ciudad → rastreo e indexación.
export const metadata: Metadata = metadatosPagina({
  title: 'Veterinarios por ciudad — directorio completo',
  description:
    'Encuentra clínicas veterinarias por ciudad en toda España. Directorio completo organizado por comunidad autónoma: veterinarios, urgencias 24h y especialidades cerca de ti.',
  ruta: '/ciudades',
})

export default async function CiudadesPage() {
  // Nº de clínicas de cada ciudad
  const conClinicas = new Map<string, number>()
  for (const c of await getAllClinics()) conClinicas.set(c.ciudad, (conClinicas.get(c.ciudad) ?? 0) + 1)
  const ciudadesDe = (comunidad: string) => CIUDADES_POR_COMUNIDAD[comunidad].filter((c) => conClinicas.has(c))
  const comunidades = Object.keys(CIUDADES_POR_COMUNIDAD)
    .filter((comunidad) => ciudadesDe(comunidad).length > 0)
    .sort((a, b) => a.localeCompare(b, 'es'))
  const totalCiudades = comunidades.reduce((n, comunidad) => n + ciudadesDe(comunidad).length, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Veterinarios por ciudad</h1>
      <p className="text-gray-500 mb-6 max-w-2xl">
        Explora las <strong>{totalCiudades} ciudades</strong> de España con clínicas veterinarias en
        VetEspaña. Elige tu ciudad para ver los veterinarios cercanos, sus horarios, especialidades y
        urgencias 24h.
      </p>

      {/* Buscar la ciudad directamente, sin recorrer toda la lista */}
      <div className="mb-10 max-w-2xl">
        <Buscador />
      </div>

      <div className="space-y-10">
        {comunidades.map((comunidad) => {
          const ciudades = ciudadesDe(comunidad).sort((a, b) =>
            (CIUDAD_DISPLAY[a] ?? a).localeCompare(CIUDAD_DISPLAY[b] ?? b, 'es'),
          )
          return (
            <section key={comunidad}>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span aria-hidden>{COMUNIDAD_EMOJI[comunidad] ?? '📍'}</span>
                <Link
                  href={`/comunidades/${ciudadSlug(comunidad)}`}
                  className="hover:text-teal-600"
                >
                  {nombreComunidad(comunidad)}
                </Link>
              </h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-1.5">
                {ciudades.map((ciudad) => (
                  <li key={ciudad}>
                    <Link
                      href={`/veterinarios/${ciudadSlug(ciudad)}`}
                      aria-label={`Veterinarios en ${CIUDAD_DISPLAY[ciudad] ?? ciudad}: ${conClinicas.get(ciudad) === 1 ? '1 clínica' : `${conClinicas.get(ciudad)} clínicas`}`}
                      className="text-sm text-gray-600 hover:text-teal-600 hover:underline"
                    >
                      {CIUDAD_DISPLAY[ciudad] ?? ciudad} <span className="text-gray-500">({conClinicas.get(ciudad)})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
