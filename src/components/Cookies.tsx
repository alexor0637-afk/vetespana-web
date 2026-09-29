'use client'

import { useEffect, useSyncExternalStore } from 'react'
import Link from '@/components/Enlace'
import { GA_ID } from '@/lib/legal'

// Aviso de cookies (Guía de cookies de la AEPD): Google Analytics NO se carga hasta que
// el visitante acepta. «Rechazar» está al mismo nivel que «Aceptar», la elección se
// guarda un año en el navegador y se puede cambiar cuando se quiera desde el pie
// («Configurar cookies»). Si se retira el permiso, se borran las cookies de Analytics.

// Microsoft Clarity (grabaciones y mapas de calor): solo si existe su ID al generar la
// web, y también solo con permiso. Si se activa, añadir sus cookies a /cookies.
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID
const CLAVE = 'vetespana-cookies'
const VALIDEZ_MS = 365 * 24 * 60 * 60 * 1000 // pasado un año se vuelve a preguntar

type Estado = 'servidor' | 'pendiente' | 'aceptadas' | 'rechazadas'

// Estado compartido fuera de React (el aviso y el botón del pie lo leen a la vez)
let abiertoAMano = false
const suscriptores = new Set<() => void>()
const avisarCambio = () => suscriptores.forEach((cb) => cb())

function suscribir(cb: () => void) {
  suscriptores.add(cb)
  return () => { suscriptores.delete(cb) }
}

function eleccionGuardada(): 'aceptadas' | 'rechazadas' | null {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as { eleccion?: string; fecha?: number } | null
    if (g && (g.eleccion === 'aceptadas' || g.eleccion === 'rechazadas') && Date.now() - (g.fecha ?? 0) < VALIDEZ_MS) {
      return g.eleccion
    }
  } catch {
    // almacenamiento bloqueado: se pregunta en cada visita
  }
  return null
}

const leerEstado = (): Estado => (abiertoAMano ? 'pendiente' : eleccionGuardada() ?? 'pendiente')
const estadoServidor = (): Estado => 'servidor'

function elegir(eleccion: 'aceptadas' | 'rechazadas') {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ eleccion, fecha: Date.now() }))
  } catch {
    // sin almacenamiento se aplica solo a esta visita
  }
  // Al aceptar, Analytics lo carga el efecto de AvisoCookies (un único sitio)
  if (eleccion === 'rechazadas') quitarAnalytics()
  abiertoAMano = false
  avisarCambio()
}

/** Vuelve a mostrar el aviso (botón «Configurar cookies» del pie) */
export function abrirAvisoCookies() {
  abiertoAMano = true
  avisarCambio()
}

type VentanaConGa = Window & Record<string, unknown>

function cargarAnalytics() {
  const w = window as unknown as VentanaConGa
  w[`ga-disable-${GA_ID}`] = false
  if (document.getElementById('ga-gtag')) return
  const gtag = document.createElement('script')
  gtag.id = 'ga-gtag'
  gtag.async = true
  gtag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(gtag)
  // El fragmento oficial de Google, tal cual
  const config = document.createElement('script')
  config.id = 'ga-config'
  config.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`
  document.head.appendChild(config)
  if (CLARITY_ID && !document.getElementById('ms-clarity')) {
    const clarity = document.createElement('script')
    clarity.id = 'ms-clarity'
    clarity.textContent = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`
    document.head.appendChild(clarity)
  }
}

function quitarAnalytics() {
  const w = window as unknown as VentanaConGa
  w[`ga-disable-${GA_ID}`] = true // deja de medir en esta página si ya estaba cargado
  const caduca = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  for (const trozo of document.cookie.split(';')) {
    const nombre = trozo.split('=')[0].trim()
    if (nombre === '_ga' || nombre.startsWith('_ga_') || nombre === '_gid' || nombre === '_clck' || nombre === '_clsk') {
      for (const dominio of ['', '; domain=.vetespana.es', '; domain=www.vetespana.es']) {
        document.cookie = `${nombre}=; ${caduca}${dominio}`
      }
    }
  }
}

export default function AvisoCookies() {
  const estado = useSyncExternalStore(suscribir, leerEstado, estadoServidor)

  // Con permiso ya dado en otra visita, Analytics se carga al entrar
  useEffect(() => {
    if (estado === 'aceptadas') cargarAnalytics()
  }, [estado])

  if (estado !== 'pendiente') return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <p className="text-sm text-gray-700 leading-relaxed">
          En VetEspaña usamos una cookie técnica para recordar tu elección y, <strong>solo si las aceptas</strong>,
          cookies de Google Analytics para contar las visitas y saber qué páginas se usan. Puedes cambiar de
          opinión cuando quieras en «Configurar cookies», al pie de la página.{' '}
          <Link href="/cookies" className="text-teal-700 underline">Política de cookies</Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => elegir('rechazadas')}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => elegir('aceptadas')}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

/** Botón del pie para volver a elegir */
export function BotonCookies({ className }: { className?: string }) {
  return (
    <button type="button" onClick={abrirAvisoCookies} className={className}>
      Configurar cookies
    </button>
  )
}
