'use client'

import { useSearchParams } from 'next/navigation'
import {
  ESPECIALIDADES,
  ESPECIALIDAD_EMOJI,
  CIUDADES_POR_COMUNIDAD,
  CIUDAD_DISPLAY,
  COMUNIDADES,
  COMUNIDAD_EMOJI,
} from '@/types/clinic'
import { SlidersHorizontal, X, MapPin, Map, Stethoscope, ArrowUpDown } from 'lucide-react'

// Dada una ciudad, encuentra a qué comunidad pertenece
function comunidadDeCiudad(ciudad: string): string {
  for (const [com, ciudades] of Object.entries(CIUDADES_POR_COMUNIDAD)) {
    if (ciudades.includes(ciudad)) return com
  }
  return ''
}

export default function FilterBar() {
  const searchParams = useSearchParams()

  const ciudad = searchParams.get('ciudad') ?? ''
  const comunidadParam = searchParams.get('comunidad') ?? ''
  const especialidad = searchParams.get('especialidad') ?? ''
  const urgencias = searchParams.get('urgencias') === '1'
  const orden = searchParams.get('orden') ?? 'relevancia'

  // Comunidad efectiva: la del filtro, o la deducida de la ciudad elegida
  const comunidad = comunidadParam || (ciudad ? comunidadDeCiudad(ciudad) : '')
  const ciudadesDeComunidad = comunidad ? CIUDADES_POR_COMUNIDAD[comunidad] ?? [] : []

  const hayFiltrosActivos = ciudad || comunidad || especialidad || urgencias

  // Solo cambia la URL: useSearchParams se entera y el listado se filtra en el
  // navegador al instante (web estática: no hay servidor al que pedir nada).
  function push(params: URLSearchParams) {
    const qs = params.toString()
    window.history.pushState(null, '', qs ? `/clinicas?${qs}` : '/clinicas')
  }

  // Al elegir comunidad: fija comunidad y resetea la ciudad
  function setComunidad(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('ciudad')
    if (value) params.set('comunidad', value)
    else params.delete('comunidad')
    push(params)
  }

  // Al elegir ciudad: fija ciudad y conserva su comunidad
  function setCiudad(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('ciudad', value)
      const com = comunidadDeCiudad(value)
      if (com) params.set('comunidad', com)
    } else {
      params.delete('ciudad')
      // mantiene la comunidad efectiva como filtro al quitar la ciudad
      if (comunidad) params.set('comunidad', comunidad)
    }
    push(params)
  }

  function setSimple(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') params.delete(key)
    else params.set(key, value)
    push(params)
  }

  function limpiarFiltros() {
    const params = new URLSearchParams()
    const q = searchParams.get('q')
    if (q) params.set('q', q)
    push(params)
  }

  const selectBase =
    'w-full appearance-none text-sm border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-gray-700 bg-white cursor-pointer transition-shadow focus:outline-none focus:ring-2 focus:ring-teal-400 hover:border-teal-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed'

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm mb-3">
          <SlidersHorizontal size={15} className="text-teal-600" />
          Filtros
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Comunidad autónoma */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Comunidad</label>
            <div className="relative">
              <Map size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={comunidad}
                onChange={(e) => setComunidad(e.target.value)}
                aria-label="Filtrar por comunidad autónoma"
                className={selectBase}
              >
                <option value="">Todas las comunidades</option>
                {COMUNIDADES.map((com) => (
                  <option key={com} value={com}>
                    {COMUNIDAD_EMOJI[com] ? `${COMUNIDAD_EMOJI[com]} ` : ''}{com}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>

          {/* Ciudad (depende de la comunidad) */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Ciudad</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                disabled={!comunidad}
                aria-label="Filtrar por ciudad"
                className={selectBase}
              >
                <option value="">
                  {comunidad ? `Todas en ${comunidad}` : 'Elige comunidad primero'}
                </option>
                {ciudadesDeComunidad.map((c) => (
                  <option key={c} value={c}>{CIUDAD_DISPLAY[c] ?? c}</option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>

          {/* Especialidad con emoji */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Especialidad</label>
            <div className="relative">
              <Stethoscope size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={especialidad}
                onChange={(e) => setSimple('especialidad', e.target.value)}
                aria-label="Filtrar por especialidad"
                className={selectBase}
              >
                <option value="">Todas las especialidades</option>
                {ESPECIALIDADES.map((e) => (
                  <option key={e} value={e}>
                    {ESPECIALIDAD_EMOJI[e] ? `${ESPECIALIDAD_EMOJI[e]} ` : ''}{e}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>

          {/* Ordenar */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 ml-1">Ordenar</label>
            <div className="relative">
              <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={orden}
                onChange={(e) => setSimple('orden', e.target.value === 'relevancia' ? null : e.target.value)}
                aria-label="Ordenar resultados"
                className={selectBase}
              >
                <option value="relevancia">Relevancia</option>
                <option value="valoracion">Mejor valoradas</option>
                <option value="nombre">Por nombre</option>
              </select>
              <Chevron />
            </div>
          </div>
        </div>

        {/* Urgencias 24h */}
        <label className="mt-3 inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            checked={urgencias}
            onChange={(e) => setSimple('urgencias', e.target.checked ? '1' : null)}
            className="rounded accent-teal-600 w-4 h-4 cursor-pointer"
          />
          🚨 Solo con urgencias 24h
        </label>
      </div>

      {/* Chips de filtros activos */}
      {hayFiltrosActivos && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Filtrando por:</span>

          {comunidad && (
            <button
              onClick={() => setComunidad('')}
              className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium px-3 py-1 rounded-full hover:bg-teal-100 transition-colors"
            >
              {COMUNIDAD_EMOJI[comunidad] ?? '🗺️'} {comunidad}
              <X size={12} />
            </button>
          )}

          {ciudad && (
            <button
              onClick={() => setCiudad('')}
              className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium px-3 py-1 rounded-full hover:bg-teal-100 transition-colors"
            >
              📍 {CIUDAD_DISPLAY[ciudad] ?? ciudad}
              <X size={12} />
            </button>
          )}

          {especialidad && (
            <button
              onClick={() => setSimple('especialidad', null)}
              className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium px-3 py-1 rounded-full hover:bg-teal-100 transition-colors"
            >
              {ESPECIALIDAD_EMOJI[especialidad] ?? '🩺'} {especialidad}
              <X size={12} />
            </button>
          )}

          {urgencias && (
            <button
              onClick={() => setSimple('urgencias', null)}
              className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-medium px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
            >
              🚨 Urgencias 24h
              <X size={12} />
            </button>
          )}

          <button
            onClick={limpiarFiltros}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors ml-1"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  )
}

// Flechita decorativa a la derecha de cada select
function Chevron() {
  return (
    <svg
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      width="12" height="12" viewBox="0 0 12 12" fill="none"
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
