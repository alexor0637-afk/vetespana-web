'use client'

import { useEffect, useRef, useState } from 'react'
import Link from '@/componentes/estructura/Enlace'
import { Menu, X, Navigation, Zap } from 'lucide-react'

// Menú hamburguesa para móvil: da acceso a todas las secciones (en escritorio
// el menú ya se ve entero, este componente solo aparece en pantallas pequeñas).
export default function MenuMovil() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const botonRef = useRef<HTMLButtonElement>(null)

  // Escape cierra el menú y devuelve el foco al botón
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        botonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="md:hidden">
      <button
        ref={botonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        aria-controls="menu-movil"
        className="p-2 -mr-2 text-gray-700"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <>
          {/* Capa para cerrar al tocar fuera */}
          <div className="fixed inset-0 top-16 bg-black/20 z-40" onClick={close} aria-hidden="true" />
          <nav
            id="menu-movil"
            aria-label="Menú principal"
            className="absolute left-0 right-0 top-16 bg-white border-b border-gray-100 shadow-lg z-50 flex flex-col px-4 text-gray-700 font-medium"
          >
            <Link href="/clinicas" onClick={close} className="py-3.5 border-b border-gray-50">
              Buscar clínicas
            </Link>
            <Link href="/cerca-de-mi" onClick={close} className="py-3.5 border-b border-gray-50 flex items-center gap-1.5">
              <Navigation size={16} className="fill-current" /> Cerca de mí
            </Link>
            <Link href="/urgencias-veterinarias-24h" onClick={close} className="py-3.5 border-b border-gray-50 flex items-center gap-1.5">
              <Zap size={16} className="text-red-600" /> Urgencias 24h
            </Link>
            <Link href="/guias" onClick={close} className="py-3.5 border-b border-gray-50">
              Guías
            </Link>
            <Link href="/alta-clinica" onClick={close} className="py-3.5 text-teal-700 font-semibold">
              Añade tu clínica
            </Link>
          </nav>
        </>
      )}
    </div>
  )
}
