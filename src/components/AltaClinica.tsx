'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import Link from '@/components/Enlace'
import FormularioClinica from '@/components/FormularioClinica'
import { cargarIndice } from '@/lib/indice'
import { CIUDAD_DISPLAY, type Clinic } from '@/types/clinic'

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

/**
 * Página de alta: primero se busca si la clínica ya está (casi todas lo están) para
 * no duplicarla; si está, se piden cambios desde su ficha; si no, formulario de alta.
 */
export default function AltaClinica({ masDe }: { masDe: string }) {
  const [busqueda, setBusqueda] = useState('')
  const [clinicas, setClinicas] = useState<Clinic[] | null>(null)
  const [fallo, setFallo] = useState(false)
  const [nueva, setNueva] = useState(false)
  // Una vez abierto, el formulario se queda montado: «Volver a buscar» no borra lo escrito
  const [formularioAbierto, setFormularioAbierto] = useState(false)

  function cargar() {
    setFallo(false)
    cargarIndice().then(setClinicas, () => setFallo(true))
  }

  function buscar(texto: string) {
    setBusqueda(texto)
    if (!clinicas && !fallo && texto.trim().length >= 3) cargar()
  }

  function abrirFormulario() {
    setNueva(true)
    setFormularioAbierto(true)
  }

  const resultados = useMemo(() => {
    const q = normalizar(busqueda)
    if (q.length < 3 || !clinicas) return []
    // Con 6 cifras o más se busca también por teléfono (la misma clínica puede tener otro nombre)
    const cifras = q.replace(/\D/g, '')
    const palabras = q.split(' ')
    return clinicas
      .filter((c) => {
        if (cifras.length >= 6 && (c.telefono ?? '').replace(/\D/g, '').includes(cifras)) return true
        const texto = normalizar(`${c.nombre} ${CIUDAD_DISPLAY[c.ciudad] ?? c.ciudad} ${c.direccion}`)
        return palabras.every((p) => texto.includes(p))
      })
      .slice(0, 8)
  }, [busqueda, clinicas])

  const formulario = formularioAbierto && (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 ${nueva ? '' : 'hidden'}`}>
      <h2 className="mb-1 text-xl font-bold text-gray-900">Añadir una clínica nueva</h2>
      <p className="mb-6 text-sm text-gray-500">
        Tarda unos 5 minutos. Los campos con * son obligatorios.{' '}
        <button type="button" onClick={() => setNueva(false)} className="font-medium text-teal-700 hover:underline">
          Volver a buscar
        </button>
      </p>
      <FormularioClinica modo="alta" />
    </div>
  )
  // Siempre la misma estructura (formulario + buscador, uno de los dos oculto): si no,
  // React volvería a montar el formulario y se perdería lo escrito
  const buscando = busqueda.trim().length >= 3
  return (
    <>
    {formulario}
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 sm:p-8 ${nueva ? 'hidden' : ''}`}>
      <h2 className="mb-1 text-xl font-bold text-gray-900">Primero, ¿ya aparece tu clínica?</h2>
      <p className="mb-4 text-sm text-gray-500">
        Tenemos más de {masDe} clínicas. Si la tuya ya está, puedes actualizar sus datos en lugar de darla de alta otra vez.
      </p>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => buscar(e.target.value)}
          placeholder="Nombre de la clínica (y la ciudad) o su teléfono"
          aria-label="Buscar tu clínica"
          className="w-full rounded-xl border border-gray-200 py-3 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {buscando && (
        <div className="mt-4" aria-live="polite">
          {fallo ? (
            <p className="text-sm text-gray-600">
              No hemos podido buscar (revisa tu conexión).{' '}
              <button type="button" onClick={cargar} className="font-medium text-teal-700 hover:underline">
                Reintentar
              </button>
            </p>
          ) : !clinicas ? (
            <p className="text-sm text-gray-500">Buscando…</p>
          ) : resultados.length ? (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {resultados.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{c.nombre}</p>
                    <p className="truncate text-xs text-gray-500">
                      {c.direccion}, {CIUDAD_DISPLAY[c.ciudad] ?? c.ciudad}
                    </p>
                  </div>
                  <Link
                    href={`/clinicas/${c.slug}#actualizar`}
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-100"
                  >
                    Es la mía <ArrowRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No encontramos ninguna clínica con ese nombre.</p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
        <span className="text-sm text-gray-600">¿No aparece?</span>
        <button
          type="button"
          onClick={abrirFormulario}
          className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-teal-800"
        >
          Añadir mi clínica gratis <ArrowRight size={16} />
        </button>
      </div>
    </div>
    </>
  )
}
