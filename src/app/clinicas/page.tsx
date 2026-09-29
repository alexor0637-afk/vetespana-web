import { Suspense } from 'react'
import type { Metadata } from 'next'
import { searchClinics } from '@/lib/datos'
import ClinicGrid from '@/components/ClinicGrid'
import FilterBar from '@/components/FilterBar'
import SearchBar, { SearchBarDesdeUrl } from '@/components/SearchBar'
import ClinicasExplorer from '@/components/ClinicasExplorer'
import { metadatosPagina } from '@/lib/seo'

// Página estática. Los filtros (?especialidad=, ?urgencias=1, ?q=…) se aplican en
// el navegador sobre el índice de clínicas; ?ciudad= y ?comunidad= solas redirigen
// a sus URLs limpias (/veterinarios/… y /comunidades/…).
export const metadata: Metadata = metadatosPagina({
  title: 'Todas las clínicas veterinarias en España',
  description:
    'Directorio de clínicas veterinarias en España. Filtra por comunidad, ciudad, especialidad y urgencias 24h. Consulta teléfono, horario y dirección.',
  ruta: '/clinicas',
})

const PAGE = 24

export default async function ClinicasPage() {
  const todas = await searchClinics({})

  // Listado general: es lo que lleva el HTML (y lo que ve Google)
  const listaGeneral = (
    <>
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Todas las clínicas veterinarias en España</h1>
        <span className="text-sm text-gray-500">{todas.length} resultados</span>
      </div>
      <ClinicGrid initial={todas.slice(0, PAGE)} total={todas.length} filtro={{}} />
    </>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Búsqueda */}
      <div className="mb-6">
        <Suspense fallback={<SearchBar />}>
          <SearchBarDesdeUrl />
        </Suspense>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <Suspense fallback={<div className="h-40 bg-white border border-gray-200 rounded-2xl" />}>
          <FilterBar />
        </Suspense>
      </div>

      <Suspense fallback={listaGeneral}>
        <ClinicasExplorer>{listaGeneral}</ClinicasExplorer>
      </Suspense>
    </div>
  )
}
