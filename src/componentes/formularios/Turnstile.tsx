'use client'

import { useEffect, useRef } from 'react'
import { TURNSTILE_SITEKEY } from '@/utilidades/formulario-clinica'

// Comprobación anti-robots de Cloudflare (Turnstile) para los formularios. Casi siempre
// es automática; solo a quien parece un robot se le pide marcar una casilla. El script
// de Cloudflare se carga cuando el formulario se acerca a la pantalla, no en cada visita.
// Cada token vale para UN envío: tras un intento fallido, el formulario vuelve a montar
// este componente (con otra `key`) para conseguir uno nuevo.
// `onToken` tiene que ser estable (p. ej. el setter de un useState).

interface TurnstileApi {
  render: (el: HTMLElement, opciones: Record<string, unknown>) => string
  remove: (id: string) => void
}
type VentanaConTurnstile = Window & { turnstile?: TurnstileApi }

let cargando: Promise<void> | null = null
function cargarScript(): Promise<void> {
  cargando ??= new Promise<void>((resolver, rechazar) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolver()
    s.onerror = () => {
      cargando = null // permite reintentar
      rechazar(new Error('No se pudo cargar la comprobación anti-robots'))
    }
    document.head.appendChild(s)
  })
  return cargando
}

export default function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const w = window as VentanaConTurnstile
    let id: string | undefined
    let cancelado = false
    const iniciar = () =>
      cargarScript()
        .then(() => {
          if (cancelado || !w.turnstile) return
          id = w.turnstile.render(el, {
            sitekey: TURNSTILE_SITEKEY,
            language: 'es',
            callback: (token: string) => onToken(token),
            'expired-callback': () => onToken(''),
            'error-callback': () => onToken(''),
          })
        })
        .catch(() => onToken(''))
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          observador.disconnect()
          iniciar()
        }
      },
      { rootMargin: '300px' },
    )
    observador.observe(el)
    return () => {
      cancelado = true
      observador.disconnect()
      if (id) w.turnstile?.remove(id)
    }
  }, [onToken])

  // Hueco reservado para la casilla (así la página no «salta» al aparecer)
  return <div ref={ref} className="min-h-[65px]" />
}
