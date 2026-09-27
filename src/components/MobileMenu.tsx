'use client'

import { useState } from 'react'
import Link from '@/components/Enlace'
import { Menu, X, Navigation } from 'lucide-react'

// Menú hamburguesa para móvil: da acceso a todas las secciones (en escritorio
// el menú ya se ve entero, este componente solo aparece en pantallas pequeñas).
export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        className="p-2 -mr-2 text-gray-700"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <>
          {/* Capa para cerrar al tocar fuera */}
          <div className="fixed inset-0 top-16 bg-black/20 z-40" onClick={close} aria-hidden="true" />
          <nav className="absolute left-0 right-0 top-16 bg-white border-b border-gray-100 shadow-lg z-50 flex flex-col px-4 text-gray-700 font-medium">
            <Link href="/clinicas" onClick={close} className="py-3.5 border-b border-gray-50">
              Buscar clínicas
            </Link>
            <Link href="/cerca-de-mi" onClick={close} className="py-3.5 border-b border-gray-50 flex items-center gap-1.5">
              <Navigation size={16} className="fill-current" /> Cerca de mí
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
