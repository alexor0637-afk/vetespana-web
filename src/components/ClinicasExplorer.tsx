'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Clinic } from '@/types/clinic'
import { CIUDAD_DISPLAY } from '@/types/clinic'
import { filtrarClinicas, paramsDesdeUrl } from '@/lib/search'
import { cargarIndice } from '@/lib/indice'
import { ciudadSlug } from '@/lib/ciudad-slug'
import { cityFacts } from '@/lib/city-content'
import ClinicGrid from './ClinicGrid'
import CitySeoContent from './CitySeoContent'

const LOTE = 24

/**
 * Listado de /clinicas con filtros en la URL. La web es estática: sin filtros se
 * muestra el listado general que ya viene en el HTML (children); con filtros, se
 * filtra en el navegador el índice /datos/clinicas.json.
 */
export default function ClinicasExplorer({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const sp = useSearchParams()
  const params = paramsDesdeUrl(sp)
  const clave = sp.toString()
  const hayFiltros = !!(params.ciudad || params.comunidad || params.especialidad || params.urgencias || params.q || params.orden)
  const otros = !!(params.especialidad || params.urgencias || params.q || params.orden)
  // Solo ciudad o solo comunidad: tienen URL limpia propia (antes, redirección 308 en el servidor)
  const destino =
    params.ciudad && !params.comunidad && !otros ? `/veterinarios/${ciudadSlug(params.ciudad)}`
    : params.comunidad && !params.ciudad && !otros ? `/comunidades/${ciudadSlug(params.comunidad)}`
    : null

  // Resultado (o error) de la última búsqueda, asociado a los filtros que lo produjeron
  const [resultado, setResultado] = useState<{ clave: string; lista?: Clinic[]; error?: boolean } | null>(null)

  useEffect(() => {
    if (destino) {
      router.replace(destino)
      return
    }
    if (!hayFiltros) return
    let vigente = true
    cargarIndice()
      .then((todas) => { if (vigente) setResultado({ clave, lista: filtrarClinicas(todas, params) }) })
      .catch(() => { if (vigente) setResultado({ clave, error: true }) })
    return () => { vigente = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, destino, hayFiltros])
  const actual = resultado?.clave === clave ? resultado : null

  const ciudadDisplay = params.ciudad ? CIUDAD_DISPLAY[params.ciudad] ?? params.ciudad : undefined
  const lugarDisplay = ciudadDisplay ?? params.comunidad ?? 'España'
  const titulo = params.ciudad && !params.especialidad
    ? `Veterinarios en ${lugarDisplay}`
    : ['Clínicas veterinarias', params.especialidad ? `· ${params.especialidad}` : '', params.urgencias ? '· urgencias 24h' : '', `en ${lugarDisplay}`]
        .filter(Boolean)
        .join(' ')

  useEffect(() => {
    if (hayFiltros && !destino) document.title = `${titulo} | VetEspaña`
  }, [hayFiltros, destino, titulo])

  if (destino) return <p className="text-center py-20 text-gray-400">Cargando…</p>
  if (!hayFiltros) return <>{children}</>
  if (actual?.error) return <p className="text-center py-20 text-gray-500">No se ha podido cargar el listado. Recarga la página.</p>
  if (!actual?.lista) return <p className="text-center py-20 text-gray-400">Buscando clínicas…</p>

  const lista = actual.lista
  const { count24h, topEsp } = cityFacts(lista)
  return (
    <>
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
        <span className="text-sm text-gray-500">{lista.length} resultado{lista.length !== 1 ? 's' : ''}</span>
      </div>

      {lista.length > 0 ? (
        <ClinicGrid key={clave} initial={lista.slice(0, LOTE)} total={lista.length} filtro={params} />
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium text-gray-600 mb-2">Sin resultados</p>
          <p className="text-sm">Prueba a cambiar los filtros o ampliar la búsqueda</p>
        </div>
      )}

      {(params.ciudad || params.comunidad) && (
        <CitySeoContent
          lugarDisplay={lugarDisplay}
          total={lista.length}
          count24h={count24h}
          topEsp={topEsp}
          especialidad={params.especialidad}
        />
      )}
    </>
  )
}
