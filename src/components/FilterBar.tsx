'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ESPECIALIDADES,
  ESPECIALIDAD_EMOJI,
  COMUNIDADES,
  COMUNIDAD_EMOJI,
  comunidadDeCiudad,
  nombreCiudad,
  nombreComunidad,
} from '@/types/clinic'
import { paramsDesdeUrl } from '@/lib/search'
import { SlidersHorizontal, X, Map, Stethoscope, ArrowUpDown, ChevronDown } from 'lucide-react'

// «Urgencias» no sale como especialidad: se confundía con las urgencias 24 h, que tienen
// su propia casilla (solo aparece si ya viene en la URL, para poder quitarla)
const ESPECIALIDADES_FILTRO = ESPECIALIDADES.filter((e) => e !== 'Urgencias')

interface Valores {
  ciudad: string
  comunidad: string
  especialidad: string
  urgencias: boolean
  orden: string
  q: string
}
const SIN_FILTROS: Valores = { ciudad: '', comunidad: '', especialidad: '', urgencias: false, orden: 'relevancia', q: '' }

/** Filtros de /clinicas. Viven en la URL: el listado (ClinicasExplorer) la lee y filtra. */
export default function FilterBar() {
  const searchParams = useSearchParams()
  const p = paramsDesdeUrl(searchParams)
  const valores: Valores = {
    ciudad: p.ciudad ?? '',
    // Comunidad efectiva: la de la ciudad elegida (manda sobre ?comunidad=) o la del filtro
    comunidad: p.ciudad ? comunidadDeCiudad(p.ciudad) ?? '' : p.comunidad ?? '',
    especialidad: p.especialidad ?? '',
    urgencias: !!p.urgencias,
    orden: p.orden ?? 'relevancia',
    q: p.q?.trim() ?? '',
  }

  // Solo cambia la URL: useSearchParams se entera y el listado se filtra en el
  // navegador al instante (web estática: no hay servidor al que pedir nada).
  function cambiar(editar: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    editar(params)
    const qs = params.toString()
    window.history.pushState(null, '', qs ? `/clinicas?${qs}` : '/clinicas')
  }
  const poner = (clave: string, valor: string | null) =>
    cambiar((params) => (valor ? params.set(clave, valor) : params.delete(clave)))

  return (
    <Vista
      valores={valores}
      // Al elegir comunidad se quita la ciudad (la ciudad se elige en el buscador de arriba)
      onComunidad={(v) => cambiar((params) => { params.delete('ciudad'); if (v) params.set('comunidad', v); else params.delete('comunidad') })}
      onEspecialidad={(v) => poner('especialidad', v)}
      onOrden={(v) => poner('orden', v === 'relevancia' ? null : v)}
      onUrgencias={(v) => poner('urgencias', v ? '1' : null)}
      onQuitarCiudad={() => poner('ciudad', null)}
      onQuitarTexto={() => poner('q', null)}
      onLimpiar={() => window.history.pushState(null, '', '/clinicas')}
    />
  )
}

/** Los mismos filtros, vacíos y quietos: ocupan lo mismo mientras carga la página (sin saltos) */
export function FilterBarVacia() {
  return <Vista valores={SIN_FILTROS} />
}

interface VistaProps {
  valores: Valores
  onComunidad?: (v: string) => void
  onEspecialidad?: (v: string) => void
  onOrden?: (v: string) => void
  onUrgencias?: (v: boolean) => void
  onQuitarCiudad?: () => void
  onQuitarTexto?: () => void
  onLimpiar?: () => void
}

function Vista({ valores, onComunidad, onEspecialidad, onOrden, onUrgencias, onQuitarCiudad, onQuitarTexto, onLimpiar }: VistaProps) {
  // En el móvil los desplegables van plegados para que se vea el listado
  const [abierto, setAbierto] = useState(false)
  const { ciudad, comunidad, especialidad, urgencias, orden, q } = valores
  const nPlegados = [comunidad && !ciudad, especialidad, orden !== 'relevancia'].filter(Boolean).length
  const hayFiltrosActivos = ciudad || comunidad || especialidad || urgencias || q || orden !== 'relevancia'

  const selectBase =
    'w-full appearance-none text-sm border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-gray-700 bg-white cursor-pointer transition-shadow focus:outline-none focus:ring-2 focus:ring-teal-400 hover:border-teal-300'
  const etiqueta = 'block text-xs font-medium text-gray-500 mb-1 ml-1'
  const icono = 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
  const chip = 'inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium px-3 py-1 rounded-full hover:bg-teal-100 transition-colors'

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {/* En el móvil, «Filtros» abre y cierra los desplegables */}
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            aria-expanded={abierto}
            aria-controls="panel-filtros"
            className="sm:hidden inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
          >
            <SlidersHorizontal size={15} className="text-teal-600" />
            Filtros{nPlegados ? ` (${nPlegados})` : ''}
            <ChevronDown size={15} className={`text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-gray-500 font-semibold text-sm">
            <SlidersHorizontal size={15} className="text-teal-600" />
            Filtros
          </div>

          {/* Urgencias 24h: siempre a la vista, también en el móvil */}
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              checked={urgencias}
              onChange={(e) => onUrgencias?.(e.target.checked)}
              className="rounded accent-teal-600 w-4 h-4 cursor-pointer"
            />
            🚨 Solo urgencias 24h
          </label>
        </div>

        <div id="panel-filtros" className={`${abierto ? 'grid' : 'hidden'} sm:grid mt-3 grid-cols-1 sm:grid-cols-3 gap-3`}>
          {/* Comunidad autónoma */}
          <div>
            <label htmlFor="filtro-comunidad" className={etiqueta}>Comunidad</label>
            <div className="relative">
              <Map size={15} className={icono} />
              <select id="filtro-comunidad" value={comunidad} onChange={(e) => onComunidad?.(e.target.value)} className={selectBase}>
                <option value="">Todas las comunidades</option>
                {COMUNIDADES.map((com) => (
                  <option key={com} value={com}>
                    {COMUNIDAD_EMOJI[com] ? `${COMUNIDAD_EMOJI[com]} ` : ''}{nombreComunidad(com)}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>

          {/* Especialidad */}
          <div>
            <label htmlFor="filtro-especialidad" className={etiqueta}>Especialidad</label>
            <div className="relative">
              <Stethoscope size={15} className={icono} />
              <select id="filtro-especialidad" value={especialidad} onChange={(e) => onEspecialidad?.(e.target.value)} className={selectBase}>
                <option value="">Todas las especialidades</option>
                {(especialidad === 'Urgencias' ? ESPECIALIDADES : ESPECIALIDADES_FILTRO).map((e) => (
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
            <label htmlFor="filtro-orden" className={etiqueta}>Ordenar</label>
            <div className="relative">
              <ArrowUpDown size={15} className={icono} />
              <select id="filtro-orden" value={orden} onChange={(e) => onOrden?.(e.target.value)} className={selectBase}>
                <option value="relevancia">Relevancia</option>
                <option value="valoracion">Mejor valoradas</option>
                <option value="nombre">Por nombre</option>
              </select>
              <Chevron />
            </div>
          </div>
        </div>
      </div>

      {/* Chips de filtros activos */}
      {hayFiltrosActivos && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Filtrando por:</span>

          {ciudad ? (
            <button type="button" onClick={onQuitarCiudad} aria-label={`Quitar filtro: ${nombreCiudad(ciudad)}`} className={chip}>
              📍 {nombreCiudad(ciudad)}
              <X size={12} aria-hidden />
            </button>
          ) : comunidad && (
            <button type="button" onClick={() => onComunidad?.('')} aria-label={`Quitar filtro: ${nombreComunidad(comunidad)}`} className={chip}>
              {COMUNIDAD_EMOJI[comunidad] ?? '🗺️'} {nombreComunidad(comunidad)}
              <X size={12} aria-hidden />
            </button>
          )}

          {q && (
            <button type="button" onClick={onQuitarTexto} aria-label={`Quitar búsqueda: ${q}`} className={chip}>
              🔎 “{q}”
              <X size={12} aria-hidden />
            </button>
          )}

          {especialidad && (
            <button type="button" onClick={() => onEspecialidad?.('')} aria-label={`Quitar filtro: ${especialidad}`} className={chip}>
              {ESPECIALIDAD_EMOJI[especialidad] ?? '🩺'} {especialidad}
              <X size={12} aria-hidden />
            </button>
          )}

          {urgencias && (
            <button
              type="button"
              onClick={() => onUrgencias?.(false)}
              aria-label="Quitar filtro: urgencias 24 horas"
              className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-medium px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
            >
              🚨 Urgencias 24h
              <X size={12} aria-hidden />
            </button>
          )}

          {orden !== 'relevancia' && (
            <button type="button" onClick={() => onOrden?.('relevancia')} aria-label="Quitar orden" className={chip}>
              ↕️ {orden === 'valoracion' ? 'Mejor valoradas' : 'Por nombre'}
              <X size={12} aria-hidden />
            </button>
          )}

          <button
            type="button"
            onClick={onLimpiar}
            className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors ml-1"
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
      width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
