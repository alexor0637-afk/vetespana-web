import type { Metadata } from 'next'
import Link from '@/componentes/estructura/Enlace'
import ClinicasCercanas from '@/componentes/clinicas/ClinicasCercanas'
import { metadatosPagina } from '@/utilidades/seo'

export const metadata: Metadata = metadatosPagina({
  title: 'Veterinario cerca de mí — Clínicas veterinarias cercanas',
  description:
    'Encuentra el veterinario más cercano a tu ubicación. Clínicas veterinarias cerca de ti en toda España, ordenadas por distancia: horarios, teléfono, urgencias 24h y cómo llegar.',
  ruta: '/cerca-de-mi',
})

export default function CercaDeMiPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Veterinario cerca de mí 📍
        </h1>
        <p className="text-gray-500">
          Encuentra las clínicas veterinarias más cercanas a tu ubicación, ordenadas por distancia.
          Con horarios, teléfono y urgencias 24h.
        </p>
      </div>

      <ClinicasCercanas />

      {/* Texto SEO de apoyo */}
      <div className="mt-12 max-w-3xl mx-auto text-sm text-gray-500 space-y-3 border-t border-gray-100 pt-8">
        <h2 className="text-base font-semibold text-gray-700">Tu veterinario más cercano, en un clic</h2>
        <p>
          Cuando tu mascota necesita atención, lo último que quieres es perder tiempo. En VetEspaña
          puedes ver al instante las <strong>clínicas veterinarias cerca de ti</strong> en cualquier
          punto de España, ordenadas de la más próxima a la más lejana.
        </p>
        <p>
          También puedes explorar por <strong>comunidad autónoma, ciudad o especialidad</strong>{' '}
          (urgencias 24h, animales exóticos, cirugía, dermatología y más) desde el{' '}
          <Link href="/clinicas" className="text-teal-700 underline">buscador de clínicas</Link>.
        </p>
        <p className="text-xs text-gray-400">
          Parte de las ubicaciones: ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
            colaboradores de OpenStreetMap
          </a>
          .
        </p>
      </div>
    </div>
  )
}
