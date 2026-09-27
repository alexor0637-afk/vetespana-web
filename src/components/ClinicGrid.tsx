'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import ClinicCard from './ClinicCard'
import type { Clinic } from '@/types/clinic'
import { filtrarClinicas, type SearchParams } from '@/lib/search'
import { cargarIndice } from '@/lib/indice'

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
export default function ClinicGrid({ initial, total, filtro }: Props) {
  const [items, setItems] = useState<Clinic[]>(initial)
  const [loading, setLoading] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const clave = JSON.stringify(filtro)

  const loadMore = useCallback(async () => {
    if (loading || items.length >= total) return
    setLoading(true)
    try {
      const todas = filtrarClinicas(await cargarIndice(), JSON.parse(clave) as SearchParams)
      setItems((prev) => [...prev, ...todas.slice(prev.length, prev.length + LOTE)])
    } catch {
      /* si falla la red, no rompemos la página */
    } finally {
      setLoading(false)
    }
  }, [loading, items.length, total, clave])

  useEffect(() => {
    if (items.length >= total) return
    const el = sentinel.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '600px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [items.length, total, loadMore])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((clinic, i) => (
          <ClinicCard key={clinic.id} clinic={clinic} priority={i < 3} />
        ))}
      </div>

      {/* Se cargan más solas al acercarse aquí; el botón sirve con teclado o si falla la carga automática */}
      {items.length < total && (
        <div ref={sentinel} className="flex justify-center py-8">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="text-sm font-medium text-teal-700 hover:text-teal-800 border border-teal-200 hover:border-teal-300 bg-white rounded-full px-5 py-2 transition-colors disabled:opacity-60"
          >
            {loading ? 'Cargando…' : `Ver más clínicas (${items.length} de ${total})`}
          </button>
        </div>
      )}
    </>
  )
}
