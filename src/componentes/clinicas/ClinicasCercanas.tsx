'use client'

import { useEffect, useRef, useState } from 'react'
import { Navigation, LoaderCircle, MapPin } from 'lucide-react'
import TarjetaClinica from '@/componentes/clinicas/TarjetaClinica'
import Buscador from '@/componentes/busqueda/Buscador'
import type { Clinic } from '@/tipos/clinica'
import { cargarIndice } from '@/utilidades/indice'

type Resultado = Clinic & { distanciaKm: number }
// sin-posicion: el navegador no ha sabido dónde estás · error: no se ha podido cargar el listado
type Estado = 'inicio' | 'cargando' | 'ok' | 'denegado' | 'sin-posicion' | 'error'

const MOSTRAR = 30
const LEJOS_KM = 50

// Distancia en km entre dos puntos (fórmula de Haversine)
function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Todas las clínicas con coordenadas, de la más cercana a la más lejana. Se calcula en el
// navegador con el índice de clínicas: la ubicación del usuario no sale de su dispositivo.
async function porCercania(lat: number, lng: number): Promise<Resultado[]> {
  const clinicas = await cargarIndice()
  return clinicas
    .filter((c) => c.lat !== undefined && c.lng !== undefined)
    .map((c) => ({ ...c, distanciaKm: Math.round(distanciaKm(lat, lng, c.lat!, c.lng!) * 10) / 10 }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm)
}

// Posición aproximada (para ordenar por km basta y es mucho más rápida en interiores);
// si tarda demasiado, se usa la última conocida aunque sea de hace un rato
function pedirPosicion(): Promise<GeolocationPosition> {
  const pedir = (opciones: PositionOptions) =>
    new Promise<GeolocationPosition>((ok, mal) => navigator.geolocation.getCurrentPosition(ok, mal, opciones))
  return pedir({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }).catch((err: GeolocationPositionError) => {
    if (err.code !== err.TIMEOUT) throw err
    return pedir({ enableHighAccuracy: false, timeout: 15000, maximumAge: Infinity })
  })
}

export default function ClinicasCercanas() {
  const [estado, setEstado] = useState<Estado>('inicio')
  const [cercanas, setCercanas] = useState<Resultado[]>([])
  const [solo24h, setSolo24h] = useState(false)
  const avisoRef = useRef<HTMLHeadingElement>(null)

  // Al terminar (bien o mal), el foco pasa al título del resultado: el botón pulsado desaparece
  useEffect(() => {
    if (estado !== 'inicio' && estado !== 'cargando') avisoRef.current?.focus()
  }, [estado])

  async function buscarCerca() {
    if (!('geolocation' in navigator)) {
      setEstado('sin-posicion')
      return
    }
    setEstado('cargando')
    cargarIndice().catch(() => {}) // se descarga mientras el navegador averigua la posición
    let pos: GeolocationPosition
    try {
      pos = await pedirPosicion()
    } catch (err) {
      const e = err as GeolocationPositionError
      setEstado(e.code === e.PERMISSION_DENIED ? 'denegado' : 'sin-posicion')
      return
    }
    try {
      setCercanas(await porCercania(pos.coords.latitude, pos.coords.longitude))
      setEstado('ok')
    } catch {
      setEstado('error')
    }
  }

  const resultados = (solo24h ? cercanas.filter((c) => c.urgencias24h) : cercanas).slice(0, MOSTRAR)
  const masLejana = resultados[resultados.length - 1]?.distanciaKm
  const km = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 0 })

  return (
    <div>
      {/* Botón principal */}
      {(estado === 'inicio' || estado === 'cargando') && (
        <div className="text-center py-10">
          <button
            onClick={buscarCerca}
            disabled={estado === 'cargando'}
            className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-70 text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-sm transition-colors"
          >
            {estado === 'cargando' ? (
              <>
                <LoaderCircle size={20} className="animate-spin" /> Buscando tu ubicación…
              </>
            ) : (
              <>
                <Navigation size={20} className="fill-white" /> Ver veterinarias cerca de mí
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto" aria-live="polite">
            {estado === 'cargando'
              ? 'Si tu navegador te lo pregunta, pulsa «Permitir».'
              : 'Tu navegador te pedirá permiso para usar tu ubicación. Solo se usa para calcular las clínicas más cercanas — no se guarda ni se comparte.'}
          </p>
        </div>
      )}

      {/* Sin ubicación o error → alternativa por ciudad */}
      {(estado === 'denegado' || estado === 'sin-posicion' || estado === 'error') && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <MapPin size={28} className="mx-auto text-amber-600 mb-2" />
          <h2 ref={avisoRef} tabIndex={-1} className="font-semibold text-gray-800 mb-1 outline-none">
            {estado === 'denegado'
              ? 'Tu navegador no deja usar tu ubicación en esta web'
              : estado === 'sin-posicion'
                ? 'No hemos podido saber dónde estás'
                : 'No se ha podido cargar el listado de clínicas'}
          </h2>
          <p className="text-sm text-gray-600 mb-4 max-w-xl mx-auto">
            {estado === 'denegado'
              ? 'Para usarla, permítelo en los ajustes del navegador (el icono junto a la dirección de la web) y vuelve a intentarlo. O elige tu ciudad:'
              : estado === 'sin-posicion'
                ? 'Puede pasar en interiores o con el GPS apagado. Vuelve a intentarlo o elige tu ciudad:'
                : 'Revisa tu conexión y vuelve a intentarlo, o elige tu ciudad:'}
          </p>
          <div className="max-w-2xl mx-auto text-left">
            <Buscador />
          </div>
          <button onClick={buscarCerca} className="text-sm text-teal-700 underline underline-offset-2 mt-4">
            {estado === 'denegado' ? 'Ya lo he permitido: volver a intentarlo' : 'Volver a intentarlo con mi ubicación'}
          </button>
        </div>
      )}

      {/* Resultados */}
      {estado === 'ok' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 ref={avisoRef} tabIndex={-1} className="text-lg font-bold text-gray-900 outline-none">
              {resultados.length
                ? `${resultados.length === 1 ? 'La veterinaria más cercana' : `Las ${resultados.length} veterinarias más cercanas`}${solo24h ? ' con urgencias 24h' : ''}${masLejana !== undefined ? ` (a menos de ${km(Math.ceil(masLejana))} km)` : ''}`
                : 'No encontramos clínicas cercanas'}
            </h2>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={solo24h}
                  onChange={(e) => setSolo24h(e.target.checked)}
                  className="rounded accent-teal-600 w-4 h-4 cursor-pointer"
                />
                🚨 Solo urgencias 24h
              </label>
              <button onClick={buscarCerca} className="text-sm text-teal-700 hover:text-teal-800 underline underline-offset-2">
                Actualizar
              </button>
            </div>
          </div>

          {resultados.length > 0 && resultados[0].distanciaKm > LEJOS_KM && (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-700">
              Aviso: la más cercana que tenemos está a {km(resultados[0].distanciaKm)} km. Puede que haya
              clínicas más cerca que aún no estén en VetEspaña.
            </p>
          )}

          {resultados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {resultados.map((c) => (
                <TarjetaClinica key={c.id} clinic={c} distanciaKm={c.distanciaKm} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-4">🐾</div>
              <p className="text-sm">Prueba a buscar por tu ciudad.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
