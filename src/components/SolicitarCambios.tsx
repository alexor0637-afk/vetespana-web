'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
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

// Lo que se puede enfocar con el tabulador dentro de la ventana
const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]'

/** «¿Es tu clínica? Actualiza sus datos»: abre el formulario de cambios en una ventana */
export default function SolicitarCambios({ clinica }: { clinica: DatosClinica }) {
  const hash = useSyncExternalStore(suscribirHash, hashActual, hashServidor)
  const [abiertoAMano, setAbiertoAMano] = useState(false)
  const abierto = abiertoAMano || hash === '#actualizar'
  // Una vez abierto, el formulario se queda montado (oculto al cerrar): así no se pierde
  // lo escrito si se cierra sin querer (clic fuera, Escape)
  const [montado, setMontado] = useState(false)
  if (abierto && !montado) setMontado(true)

  const botonRef = useRef<HTMLButtonElement>(null)
  const ventanaRef = useRef<HTMLDivElement>(null)
  const tituloRef = useRef<HTMLHeadingElement>(null)

  function cerrar() {
    setAbiertoAMano(false)
    quitarHash()
  }

  // Con la ventana abierta: foco dentro (y atrapado en ella), sin scroll de fondo y Escape
  // para cerrar. Al cerrar, el foco vuelve al botón que la abrió.
  useEffect(() => {
    if (!abierto) return
    tituloRef.current?.focus()
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbiertoAMano(false)
        quitarHash()
        return
      }
      if (e.key !== 'Tab' || !ventanaRef.current) return
      const enfocables = [...ventanaRef.current.querySelectorAll<HTMLElement>(ENFOCABLES)].filter(
        (el) => el.tabIndex >= 0 && el.getClientRects().length > 0,
      )
      if (!enfocables.length) return
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      const dentro = ventanaRef.current.contains(document.activeElement)
      if (e.shiftKey && (document.activeElement === primero || !dentro)) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', alPulsar)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const boton = botonRef.current
    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = antes
      boton?.focus()
    }
  }, [abierto])

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbiertoAMano(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-600 transition-colors hover:border-teal-400 hover:text-teal-700"
      >
        <PencilLine size={14} /> ¿Es tu clínica? Actualiza sus datos
      </button>

      {/* En <body>: si no, la columna lateral (sticky) la deja por debajo de la cabecera */}
      {montado && createPortal(
        <div
          className={`fixed inset-0 z-[70] items-start justify-center overflow-y-auto bg-black/40 p-0 sm:p-6 ${abierto ? 'flex' : 'hidden'}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrar()
          }}
        >
          <div ref={ventanaRef} role="dialog" aria-modal="true" aria-labelledby="titulo-cambios" className="relative w-full max-w-2xl bg-white shadow-xl sm:rounded-2xl">
            {/* Cabecera fija: la X sigue a mano al bajar por el formulario (sobre todo en el móvil) */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4 sm:rounded-t-2xl sm:px-8">
              <div>
                <h2 id="titulo-cambios" ref={tituloRef} tabIndex={-1} className="text-xl font-bold text-gray-900 outline-none">
                  Actualizar los datos de {clinica.nombre}
                </h2>
                <p className="text-sm text-gray-500">Para el equipo de la clínica.</p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="shrink-0 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 sm:p-8">
              <FormularioClinica modo="edicion" clinica={clinica} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
