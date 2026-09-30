'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import CitySelect from './CitySelect'
import { ciudadSlug } from '@/lib/ciudad-slug'

interface Props {
  initialCiudad?: string
  initialQuery?: string
}

export default function SearchBar({ initialCiudad = '', initialQuery = '' }: Props) {
  const [ciudad, setCiudad] = useState(initialCiudad)
  const [query, setQuery] = useState(initialQuery)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const texto = query.trim()
    const enListado = window.location.pathname === '/clinicas'
    // En /clinicas se conservan los demás filtros (urgencias 24h, especialidad, orden…)
    const params = new URLSearchParams(enListado ? window.location.search : '')
    params.delete('ciudad')
    params.delete('q')
    if (ciudad) {
      params.set('ciudad', ciudad)
      params.delete('comunidad') // la ciudad ya dice la comunidad
    }
    if (texto) params.set('q', texto)
    // Solo ciudad (sin texto ni otros filtros) → URL limpia de ciudad directamente
    if (ciudad && params.toString() === new URLSearchParams({ ciudad }).toString()) {
      // Página completa a propósito: la web estática no publica los archivos con los que
      // Next navega sin recargar (ver components/Enlace.tsx)
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/veterinarios/${ciudadSlug(ciudad)}`)
      return
    }
    const url = params.toString() ? `/clinicas?${params.toString()}` : '/clinicas'
    // Ya en /clinicas: cambia solo la URL y el listado se filtra al instante
    if (enListado) window.history.pushState(null, '', url)
    else window.location.assign(url)
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
      {/* Ciudad con autocompletado: escribe "madr" y aparece Madrid */}
      <div className="flex-1 min-w-0">
        <CitySelect value={ciudad} onChange={setCiudad} enterEnvia />
      </div>

      {/* Búsqueda libre */}
      <div className="relative flex-[2] min-w-0">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          aria-label="Buscar por especialidad o nombre de clínica"
          placeholder="Especialidad, nombre de clínica..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      <button
        type="submit"
        className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
      >
        Buscar
      </button>
    </form>
  )
}

/** Buscador con los valores de la URL (?ciudad=&q=). Va dentro de un <Suspense>. */
export function SearchBarDesdeUrl() {
  const sp = useSearchParams()
  const ciudad = sp.get('ciudad') ?? ''
  const q = sp.get('q') ?? ''
  return <SearchBar key={`${ciudad}|${q}`} initialCiudad={ciudad} initialQuery={q} />
}
