'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Clinic } from '@/types/clinic'
import { comunidadDeCiudad, nombreCiudad, nombreComunidad } from '@/types/clinic'
import { filtrarClinicas, paramsDesdeUrl, type SearchParams } from '@/lib/search'
import { cargarIndice } from '@/lib/indice'
import { ciudadSlug } from '@/lib/ciudad-slug'
import { cityFacts } from '@/lib/city-content'
import { TITULO_LISTADO } from '@/lib/seo'
import ClinicGrid from './ClinicGrid'
import CitySeoContent from './CitySeoContent'
import EsqueletoListado from './EsqueletoListado'

const LOTE = 24

// URLs antiguas /clinicas?ciudad=X y ?comunidad=X (sin más filtros): tienen URL limpia
// propia (antes, redirección 308 en el servidor). ?ciudad=X&comunidad=su comunidad cuenta
// como «solo ciudad» (así las generaba el filtro antiguo).
function urlLimpia(params: SearchParams): string | null {
  const otros = !!(params.especialidad || params.urgencias || params.q || params.orden)
  if (otros) return null
  if (params.ciudad && (!params.comunidad || params.comunidad === comunidadDeCiudad(params.ciudad))) {
    return `/veterinarios/${ciudadSlug(params.ciudad)}`
  }
  if (params.comunidad && !params.ciudad) return `/comunidades/${ciudadSlug(params.comunidad)}`
  return null
}

/**
 * Listado de /clinicas con filtros en la URL. La web es estática: sin filtros se
 * muestra el listado general que ya viene en el HTML (children); con filtros, se
 * filtra en el navegador el índice /datos/clinicas.json.
 */
export default function ClinicasExplorer({ children }: { children: React.ReactNode }) {
  const sp = useSearchParams()
  const params = paramsDesdeUrl(sp)
  const clave = sp.toString()
  const hayFiltros = !!(params.ciudad || params.comunidad || params.especialidad || params.urgencias || params.q || params.orden)
  // Solo con la URL con la que se llega a la página: si el filtro se elige aquí mismo,
  // el usuario se queda en /clinicas con sus filtros
  const [destino] = useState(() => urlLimpia(params))

  // Resultado (o error) de la última búsqueda, asociado a los filtros que lo produjeron
  const [resultado, setResultado] = useState<{ clave: string; lista?: Clinic[]; error?: boolean } | null>(null)
  const [intento, setIntento] = useState(0)

  // Ya se puede quitar el estilo que ocultaba el listado general antes de cargar (clinicas/page.tsx)
  useEffect(() => { document.getElementById('estilo-filtros')?.remove() }, [])

  useEffect(() => {
    if (destino) {
      window.location.replace(destino)
      return
    }
    if (!hayFiltros) return
    let vigente = true
    cargarIndice()
      .then((todas) => { if (vigente) setResultado({ clave, lista: filtrarClinicas(todas, params) }) })
      .catch(() => { if (vigente) setResultado({ clave, error: true }) })
    return () => { vigente = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, destino, hayFiltros, intento])
  const actual = resultado?.clave === clave ? resultado : null

  const texto = params.q?.trim()
  const lugarDisplay = params.ciudad ? nombreCiudad(params.ciudad) : params.comunidad ? nombreComunidad(params.comunidad) : 'España'
  const titulo = (params.ciudad && !params.especialidad && !params.urgencias
    ? `Veterinarios en ${lugarDisplay}`
    : ['Clínicas veterinarias', params.especialidad ? `· ${params.especialidad}` : '', params.urgencias ? '· urgencias 24h' : '', `en ${lugarDisplay}`]
        .filter(Boolean)
        .join(' ')) + (texto ? ` · «${texto}»` : '')

  // Título de la pestaña según los filtros. Se vuelve a poner cuando llega el resultado:
  // al cargar la página, Next pone el suyo al terminar de hidratarse (y taparía este)
  const listo = !!actual
  useEffect(() => {
    if (!destino) document.title = `${hayFiltros ? titulo : TITULO_LISTADO} | VetEspaña`
  }, [hayFiltros, destino, titulo, listo])

  // Lo que oye quien usa lector de pantalla al cambiar un filtro
  const aviso = !hayFiltros || destino ? '' : actual?.error ? 'No se ha podido cargar el listado' : actual?.lista ? `${actual.lista.length} resultados` : 'Buscando clínicas'
  const avisoVivo = <p className="sr-only" aria-live="polite">{aviso}</p>

  if (destino) return <>{avisoVivo}<EsqueletoListado /></>
  if (!hayFiltros) return <>{avisoVivo}{children}</>
  if (actual?.error) {
    return (
      <>
        {avisoVivo}
        <div className="text-center py-20 text-gray-600">
          <p className="mb-4">No se ha podido cargar el listado. Revisa tu conexión.</p>
          <button
            type="button"
            onClick={() => setIntento((i) => i + 1)}
            className="rounded-full border border-teal-200 bg-white px-5 py-2 text-sm font-medium text-teal-700 hover:border-teal-300"
          >
            Reintentar
          </button>
        </div>
      </>
    )
  }
  if (!actual?.lista) return <>{avisoVivo}<EsqueletoListado /></>

  const lista = actual.lista
  const { count24h, topEsp } = cityFacts(lista)
  return (
    <>
      {avisoVivo}
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
        <span className="shrink-0 text-sm text-gray-500">{lista.length} resultado{lista.length !== 1 ? 's' : ''}</span>
      </div>

      {lista.length > 0 ? (
        <ClinicGrid key={clave} initial={lista.slice(0, LOTE)} total={lista.length} filtro={params} />
      ) : (
        <div className="text-center py-20 text-gray-500">
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
