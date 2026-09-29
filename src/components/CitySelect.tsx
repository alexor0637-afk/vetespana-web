'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { MapPin, X } from 'lucide-react'
import { CIUDADES_POR_COMUNIDAD, CIUDAD_DISPLAY } from '@/types/clinic'

// Sin tildes y en minúsculas, para buscar "leon" y que salga "León".
const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Lista plana de todas las ciudades con su nombre bonito y su comunidad.
const ALL_CITIES = Object.entries(CIUDADES_POR_COMUNIDAD)
  .flatMap(([comunidad, ciudades]) =>
    ciudades.map((value) => ({ value, display: CIUDAD_DISPLAY[value] ?? value, comunidad }))
  )
  .sort((a, b) => a.display.localeCompare(b.display, 'es'))

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** id de la lista (si hay más de un selector en la página) */
  id?: string
  /** Texto de la primera opción, la que deja la ciudad vacía */
  opcionVacia?: string
  etiqueta?: string
  /** Enter sin haber escrito nada (o con la lista cerrada) envía el formulario (buscador) */
  enterEnvia?: boolean
}

/**
 * Selector de ciudad con autocompletado: en vez de un desplegable de ~290
 * ciudades, el usuario escribe parte del nombre ("madr") y aparece la opción.
 */
export default function CitySelect({
  value,
  onChange,
  placeholder = 'Todas las ciudades',
  id = 'lista-ciudades',
  opcionVacia = 'Todas las ciudades',
  etiqueta = 'Buscar ciudad',
  enterEnvia = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  // true si el usuario se ha movido por la lista con las flechas
  const [navegando, setNavegando] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedDisplay = value ? ALL_CITIES.find((c) => c.value === value)?.display ?? value : ''

  const results = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return ALL_CITIES.slice(0, 60)
    // Primero la que coincide exactamente y las que empiezan por lo escrito
    // («palma» → Palma antes que Las Palmas); dentro de cada grupo, orden alfabético.
    const orden = (c: (typeof ALL_CITIES)[number]) =>
      norm(c.display) === q || norm(c.value) === q ? 0 : norm(c.display).startsWith(q) ? 1 : 2
    return ALL_CITIES
      .filter((c) => norm(c.display).includes(q) || norm(c.value).includes(q))
      .sort((a, b) => orden(a) - orden(b))
      .slice(0, 60)
  }, [query])

  // Ciudad del texto escrito sin elegirlo de la lista: la que coincide exactamente
  // (sin tildes) o, si solo hay una coincidencia, esa.
  function ciudadEscrita(): string | null {
    const q = norm(query.trim())
    if (!q) return null
    const exacta = ALL_CITIES.find((c) => norm(c.display) === q || norm(c.value) === q)
    if (exacta) return exacta.value
    return results.length === 1 ? results[0].value : null
  }

  // Al salir sin elegir (clic fuera, Tab) se queda la ciudad escrita si se reconoce:
  // así «Sevilla» + Buscar busca en Sevilla aunque no se haya pulsado la opción.
  function cerrar() {
    const escrita = ciudadEscrita()
    if (escrita && escrita !== value) onChange(escrita)
    setQuery('')
    setNavegando(false)
    setOpen(false)
  }

  // Cierra al hacer clic fuera (se vuelve a enganchar en cada render para ver el texto actual)
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) cerrar()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  })

  // Al cambiar el texto buscado, el resaltado vuelve a la primera opción
  function buscar(texto: string) {
    setQuery(texto)
    setHighlight(0)
    setNavegando(false)
  }

  function select(val: string) {
    onChange(val)
    setQuery('')
    setHighlight(0)
    setNavegando(false)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setNavegando(true); setHighlight((h) => Math.min(h + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setNavegando(true); setHighlight((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') {
      const texto = query.trim()
      // Con algo escrito (o moviéndose con las flechas), Enter elige la opción resaltada
      const opcion = open && (texto || navegando) ? results[highlight] : undefined
      if (opcion) { e.preventDefault(); select(opcion.value); return }
      if (open && texto) { e.preventDefault(); return } // escrito algo sin coincidencias
      // Sin escribir nada: cierra la lista; en el buscador, además, busca
      setOpen(false)
      if (!enterEnvia) e.preventDefault()
    }
    else if (e.key === 'Escape') { setQuery(''); setNavegando(false); setOpen(false) }
    else if (e.key === 'Tab') { if (open) cerrar() }
  }

  // Mantiene la opción resaltada a la vista
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.children[highlight + 1] as HTMLElement | undefined // +1 por "Todas las ciudades"
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  return (
    <div ref={wrapRef} className="relative">
      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
      <input
        type="text"
        role="combobox"
        aria-controls={id}
        aria-expanded={open}
        aria-autocomplete="list"
        aria-label={etiqueta}
        value={open ? query : selectedDisplay}
        placeholder={placeholder}
        onChange={(e) => { buscar(e.target.value); setOpen(true) }}
        onFocus={() => { buscar(''); setOpen(true) }}
        onKeyDown={onKeyDown}
        className={`w-full pl-9 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-text ${
          value && !open ? 'pr-9' : 'pr-3'
        }`}
      />
      {value && !open && (
        <button
          type="button"
          aria-label="Quitar ciudad"
          onClick={() => select('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        >
          <X size={15} />
        </button>
      )}

      {open && (
        <ul
          id={id}
          role="listbox"
          ref={listRef}
          className="absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1 text-sm"
        >
          <li
            role="option"
            aria-selected={!value}
            onMouseDown={(e) => { e.preventDefault(); select('') }}
            className="px-3 py-2 cursor-pointer text-gray-500 hover:bg-gray-50"
          >
            {opcionVacia}
          </li>
          {results.map((c, i) => (
            <li
              key={c.value}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => { e.preventDefault(); select(c.value) }}
              onMouseEnter={() => setHighlight(i)}
              className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 ${
                i === highlight ? 'bg-teal-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-gray-800">{c.display}</span>
              <span className="text-xs text-gray-400 shrink-0">{c.comunidad}</span>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-3 text-gray-400">Sin coincidencias para “{query}”</li>
          )}
        </ul>
      )}
    </div>
  )
}
