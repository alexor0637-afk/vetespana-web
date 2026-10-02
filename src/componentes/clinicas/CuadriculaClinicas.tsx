'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import TarjetaClinica from '@/componentes/clinicas/TarjetaClinica'
import type { Clinic } from '@/tipos/clinica'
import { filtrarClinicas, type SearchParams } from '@/utilidades/busqueda'
import { cargarIndice } from '@/utilidades/indice'

interface Props {
  /** Primeras clínicas, ya pintadas en el HTML generado (SEO + carga rápida). */
  initial: Clinic[]
  /** Total de resultados del filtro actual. */
  total: number
  /** Filtro del listado: las siguientes se sacan del índice con el mismo filtro. */
  filtro: SearchParams
}

const LOTE = 24

/**
 * Rejilla con scroll infinito. El HTML trae solo las primeras; al bajar, las
 * siguientes salen del índice estático (/datos/clinicas.json), filtrado con la
 * misma función y el mismo orden que usó el build.
 * Para reiniciarla con otro filtro, el padre le cambia la `key`.
 */
export default function CuadriculaClinicas({ initial, total, filtro }: Props) {
  const [items, setItems] = useState<Clinic[]>(initial)
  const [loading, setLoading] = useState(false)
  const [fallo, setFallo] = useState(false)
  // true si el índice ya no tiene más (p. ej. se publicó la web entre medias con menos clínicas)
  const [agotado, setAgotado] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  // El índice ya filtrado: se filtra una vez, no en cada tanda
  const filtradas = useRef<{ clave: string; lista: Clinic[] } | null>(null)
  const clave = JSON.stringify(filtro)
  const quedan = items.length < total && !agotado

  const loadMore = useCallback(async () => {
    if (loading || !quedan) return
    setLoading(true)
    setFallo(false)
    try {
      if (filtradas.current?.clave !== clave) {
        filtradas.current = { clave, lista: filtrarClinicas(await cargarIndice(), JSON.parse(clave) as SearchParams) }
      }
      const lista = filtradas.current.lista
      // Solo las que aún no están: si la web se republicó entre medias y el orden cambió,
      // así no se repite ni se salta ninguna
      const vistas = new Set(items.map((c) => c.id))
      const nuevas = lista.filter((c) => !vistas.has(c.id)).slice(0, LOTE)
      if (nuevas.length) setItems([...items, ...nuevas])
      else setAgotado(true)
    } catch {
      setFallo(true) // sin conexión: el botón pasa a «Reintentar»
    } finally {
      setLoading(false)
    }
  }, [loading, quedan, items, clave])

  useEffect(() => {
    if (!quedan || fallo) return
    const el = sentinel.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '600px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [quedan, fallo, loadMore])

  return (
    <>
      {/* Para la navegación por encabezados: de la h1 de la página a las h3 de las tarjetas */}
      <h2 className="sr-only">Listado de clínicas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((clinic, i) => (
          <TarjetaClinica key={clinic.id} clinic={clinic} priority={i < 3} />
        ))}
      </div>

      {/* Se cargan más solas al acercarse aquí; el botón sirve con teclado o si falla la carga automática */}
      {quedan && (
        <div ref={sentinel} className="flex flex-col items-center gap-2 py-8">
          {fallo && <p role="alert" className="text-sm text-red-700">No se han podido cargar más clínicas. Revisa tu conexión.</p>}
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="text-sm font-medium text-teal-700 hover:text-teal-800 border border-teal-200 hover:border-teal-300 bg-white rounded-full px-5 py-2 transition-colors disabled:opacity-60"
          >
            {loading ? 'Cargando…' : fallo ? 'Reintentar' : `Ver más clínicas (${items.length} de ${total})`}
          </button>
        </div>
      )}
    </>
  )
}
