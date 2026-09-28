'use client'

import { Plus, X } from 'lucide-react'
import { DIAS, type DiaHorario, type ModoDia } from '@/lib/formulario-clinica'

// De 00:00 a 24:00 cada cuarto de hora (24:00 = cierre a medianoche)
const HORAS = Array.from({ length: 97 }, (_, i) =>
  `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`)

interface Props {
  valor: DiaHorario[]
  onChange: (valor: DiaHorario[]) => void
}

function SelectorHora({ valor, onChange, etiqueta }: { valor: string; onChange: (v: string) => void; etiqueta: string }) {
  // Si el horario guardado tiene una hora que no cae en cuarto de hora, también se ofrece
  const opciones = HORAS.includes(valor) || !valor ? HORAS : [...HORAS, valor].sort()
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      aria-label={etiqueta}
      className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-400"
    >
      {opciones.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>
  )
}

/** Horario por días: abierto (con uno a tres tramos), cerrado o 24 horas */
export default function HorarioEditor({ valor, onChange }: Props) {
  const cambiarDia = (i: number, dia: DiaHorario) => onChange(valor.map((d, j) => (j === i ? dia : d)))

  function copiarLunes() {
    const lunes = valor[0]
    onChange(valor.map((d, i) => (i >= 1 && i <= 4 ? { modo: lunes.modo, tramos: lunes.tramos.map(([a, b]) => [a, b]) } : d)))
  }

  return (
    <div className="space-y-2">
      {valor.map((d, i) => (
        <div key={DIAS[i]} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
          <span className="w-20 text-sm font-medium capitalize text-gray-700">{DIAS[i]}</span>
          <select
            value={d.modo}
            onChange={(e) => cambiarDia(i, { ...d, modo: e.target.value as ModoDia })}
            aria-label={`Horario del ${DIAS[i]}`}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="abierto">Abierto</option>
            <option value="cerrado">Cerrado</option>
            <option value="24h">24 horas</option>
          </select>
          {d.modo === 'abierto' && (
            <div className="flex flex-wrap items-center gap-2">
              {d.tramos.map(([apertura, cierre], t) => (
                <span key={t} className="flex items-center gap-1">
                  <SelectorHora
                    valor={apertura}
                    etiqueta={`Apertura ${t + 1} del ${DIAS[i]}`}
                    onChange={(v) => cambiarDia(i, { ...d, tramos: d.tramos.map((tr, k) => (k === t ? [v, tr[1]] : tr)) })}
                  />
                  <span className="text-gray-400">–</span>
                  <SelectorHora
                    valor={cierre}
                    etiqueta={`Cierre ${t + 1} del ${DIAS[i]}`}
                    onChange={(v) => cambiarDia(i, { ...d, tramos: d.tramos.map((tr, k) => (k === t ? [tr[0], v] : tr)) })}
                  />
                  {d.tramos.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Quitar el tramo ${t + 1} del ${DIAS[i]}`}
                      onClick={() => cambiarDia(i, { ...d, tramos: d.tramos.filter((_, k) => k !== t) })}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
              {d.tramos.length < 3 && (
                <button
                  type="button"
                  onClick={() => cambiarDia(i, { ...d, tramos: [...d.tramos, ['16:30', '20:00']] })}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50"
                >
                  <Plus size={13} /> Otro tramo
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={copiarLunes} className="text-xs font-medium text-teal-700 hover:underline">
        Copiar el horario del lunes de martes a viernes
      </button>
    </div>
  )
}
