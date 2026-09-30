import { Suspense } from 'react'
import type { Metadata } from 'next'
import { searchClinics } from '@/lib/datos'
import ClinicGrid from '@/components/ClinicGrid'
import FilterBar, { FilterBarVacia } from '@/components/FilterBar'
import SearchBar, { SearchBarDesdeUrl } from '@/components/SearchBar'
import ClinicasExplorer from '@/components/ClinicasExplorer'
import EsqueletoListado from '@/components/EsqueletoListado'
import { metadatosPagina, TITULO_LISTADO } from '@/lib/seo'

// Página estática. Los filtros (?especialidad=, ?urgencias=1, ?q=…) se aplican en
// el navegador sobre el índice de clínicas; ?ciudad= y ?comunidad= solas redirigen
// a sus URLs limpias (/veterinarios/… y /comunidades/…).
export const metadata: Metadata = metadatosPagina({
  title: TITULO_LISTADO,
  description:
    'Directorio de clínicas veterinarias en España. Filtra por comunidad, ciudad, especialidad y urgencias 24h. Consulta teléfono, horario y dirección.',
  ruta: '/clinicas',
})

const PAGE = 24

// Se ejecuta antes de pintar: si la URL trae filtros, el listado general del HTML no es
// el que se busca, así que se oculta y se enseña el esqueleto hasta que filtre el navegador
// (ClinicasExplorer quita este estilo al arrancar).
const OCULTAR_SI_HAY_FILTROS =
  "if(/[?&](ciudad|comunidad|especialidad|urgencias|q|orden)=/.test(location.search)){var s=document.createElement('style');s.id='estilo-filtros';s.textContent='#lista-general{display:none}#esqueleto-listado{display:block}';document.head.appendChild(s)}"

export default async function ClinicasPage() {
  const todas = await searchClinics({})

  // Listado general: es lo que lleva el HTML (y lo que ve Google)
  const listaGeneral = (
    <>
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{TITULO_LISTADO}</h1>
        <span className="text-sm text-gray-500">{todas.length} resultados</span>
      </div>
      <ClinicGrid initial={todas.slice(0, PAGE)} total={todas.length} filtro={{}} />
    </>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <script dangerouslySetInnerHTML={{ __html: OCULTAR_SI_HAY_FILTROS }} />

      {/* Búsqueda */}
      <div className="mb-6">
        <Suspense fallback={<SearchBar />}>
          <SearchBarDesdeUrl />
        </Suspense>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <Suspense fallback={<FilterBarVacia />}>
          <FilterBar />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <>
            <div id="esqueleto-listado" className="hidden"><EsqueletoListado /></div>
            <div id="lista-general">{listaGeneral}</div>
          </>
        }
      >
        <ClinicasExplorer>{listaGeneral}</ClinicasExplorer>
      </Suspense>
    </div>
  )
}
