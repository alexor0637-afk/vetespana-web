'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, PencilLine, X } from 'lucide-react'
import type { DatosClinica } from '@/components/FormularioClinica'

// El formulario solo se descarga cuando alguien lo abre
const FormularioClinica = dynamic(() => import('@/components/FormularioClinica'), {
  ssr: false,
  loading: () => (
    <p className="flex items-center gap-2 py-10 text-sm text-gray-500">
      <Loader2 size={16} className="animate-spin" /> Cargando el formulario…
    </p>
  ),
})

// La ficha abierta con #actualizar (el enlace de «Es la mía» en /alta-clinica) abre el formulario
const suscribirHash = (aviso: () => void) => {
  window.addEventListener('hashchange', aviso)
  return () => window.removeEventListener('hashchange', aviso)
}
const hashActual = () => window.location.hash
const hashServidor = () => ''

function quitarHash() {
  if (window.location.hash === '#actualizar') {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
}

/** «¿Es tu clínica? Actualiza sus datos»: abre el formulario de cambios en una ventana */
export default function SolicitarCambios({ clinica }: { clinica: DatosClinica }) {
  const hash = useSyncExternalStore(suscribirHash, hashActual, hashServidor)
  const [abiertoAMano, setAbiertoAMano] = useState(false)
  const abierto = abiertoAMano || hash === '#actualizar'

  function cerrar() {
    setAbiertoAMano(false)
    quitarHash()
  }

  // Con la ventana abierta: sin scroll de fondo y Escape para cerrar
  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setAbiertoAMano(false)
      quitarHash()
    }
    document.addEventListener('keydown', alPulsar)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = antes
    }
  }, [abierto])

  return (
    <>
      <button
        type="button"
        onClick={() => setAbiertoAMano(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-600 transition-colors hover:border-teal-400 hover:text-teal-700"
      >
        <PencilLine size={14} /> ¿Es tu clínica? Actualiza sus datos
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-0 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrar()
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-cambios" className="relative w-full max-w-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-8">
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="absolute right-3 top-3 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={18} />
            </button>
            <h2 id="titulo-cambios" className="mb-1 pr-10 text-xl font-bold text-gray-900">
              Actualizar los datos de {clinica.nombre}
            </h2>
            <p className="mb-6 text-sm text-gray-500">Para el equipo de la clínica.</p>
            <FormularioClinica modo="edicion" clinica={clinica} />
          </div>
        </div>
      )}
    </>
  )
}
