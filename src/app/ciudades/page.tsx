import type { Metadata } from 'next'
import Link from 'next/link'
import { CIUDADES_POR_COMUNIDAD, CIUDAD_DISPLAY, COMUNIDAD_EMOJI } from '@/types/clinic'
import { ciudadSlug } from '@/lib/ciudad-slug'

// Página estática (no lee Airtable): índice navegable de todas las ciudades.
// Reparte enlaces internos a las 368 páginas de ciudad → mejora rastreo e indexación.
export const metadata: Metadata = {
  title: 'Veterinarios por ciudad — directorio completo',
  description:
    'Encuentra clínicas veterinarias por ciudad en toda España. Directorio completo organizado por comunidad autónoma: veterinarios, urgencias 24h y especialidades cerca de ti.',
  alternates: { canonical: 'https://www.vetespana.es/ciudades' },
}

const totalCiudades = Object.values(CIUDADES_POR_COMUNIDAD).flat().length

export default function CiudadesPage() {
  const comunidades = Object.keys(CIUDADES_POR_COMUNIDAD).sort((a, b) => a.localeCompare(b, 'es'))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Veterinarios por ciudad</h1>
      <p className="text-gray-500 mb-10 max-w-2xl">
        Explora las <strong>{totalCiudades} ciudades</strong> de España con clínicas veterinarias en
        VetEspaña. Elige tu ciudad para ver los veterinarios cercanos, sus horarios, especialidades y
        urgencias 24h.
      </p>

      <div className="space-y-10">
        {comunidades.map((comunidad) => {
          const ciudades = [...CIUDADES_POR_COMUNIDAD[comunidad]].sort((a, b) =>
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
                  {comunidad}
                </Link>
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {ciudades.map((ciudad) => (
                  <Link
                    key={ciudad}
                    href={`/veterinarios/${ciudadSlug(ciudad)}`}
                    className="text-sm text-gray-600 hover:text-teal-600 hover:underline"
                  >
                    Veterinarios en {CIUDAD_DISPLAY[ciudad] ?? ciudad}
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
