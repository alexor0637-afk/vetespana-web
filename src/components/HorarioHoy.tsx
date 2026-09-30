'use client'

import { useSyncExternalStore } from 'react'
import { horarioDeHoy } from '@/lib/horario-hoy'

// Un solo reloj para todas las tarjetas de la página: avisa cada minuto
const oyentes = new Set<() => void>()
let reloj: ReturnType<typeof setInterval> | undefined
function suscribir(aviso: () => void) {
  oyentes.add(aviso)
  reloj ??= setInterval(() => oyentes.forEach((f) => f()), 60_000)
  return () => {
    oyentes.delete(aviso)
    if (!oyentes.size && reloj) {
      clearInterval(reloj)
      reloj = undefined
    }
  }
}
const minutoActual = () => Math.floor(Date.now() / 60_000)
const sinHora = () => null // al generar la web no se sabe qué hora será: se calcula en el navegador

/**
 * Horario de la tarjeta: en el HTML, la primera línea del horario; en el navegador, el de
 * hoy y si está abierta ahora (hora de la península, o de Canarias para sus clínicas).
 */
export default function HorarioHoy({ horario, canarias = false }: { horario: string; canarias?: boolean }) {
  const minuto = useSyncExternalStore(suscribir, minutoActual, sinHora)
  const hoy = minuto === null ? null : horarioDeHoy(horario, new Date(minuto * 60_000), canarias)
  if (!hoy) return <span className="line-clamp-1">{horario.split('\n')[0]}</span>
  return (
    <span className="line-clamp-1">
      <span className={`font-semibold ${hoy.abierto ? 'text-green-700' : 'text-gray-600'}`}>
        {hoy.abierto ? 'Abierto ahora' : 'Cerrado ahora'}
      </span>
      {' · '}
      {hoy.texto === 'Cerrado' ? 'hoy no abre' : hoy.texto === 'Abierto 24 horas' ? '24 horas' : `hoy ${hoy.texto}`}
    </span>
  )
}
