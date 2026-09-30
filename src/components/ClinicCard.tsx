import Link from '@/components/Enlace'
import Image from 'next/image'
import { MapPin, Phone, Clock, Star, ShieldCheck, Zap, Navigation } from 'lucide-react'
import type { Clinic } from '@/types/clinic'
import { comunidadDeCiudad, nombreCiudad } from '@/types/clinic'
import AtribucionFoto from '@/components/AtribucionFoto'
import HorarioHoy from '@/components/HorarioHoy'

interface Props {
  clinic: Clinic
  /** Distancia en km a la ubicación del usuario (solo en "Cerca de mí") */
  distanciaKm?: number
  /** Carga la imagen con prioridad (para las primeras tarjetas visibles → mejor LCP) */
  priority?: boolean
}

const GRADIENTS = [
  'from-teal-400 to-cyan-600',
  'from-emerald-400 to-teal-600',
  'from-cyan-400 to-blue-600',
  'from-teal-500 to-emerald-700',
  'from-blue-400 to-teal-600',
  'from-green-400 to-emerald-600',
]

function ClinicPlaceholder({ nombre, ciudad }: { nombre: string; ciudad: string }) {
  const idx = nombre.charCodeAt(0) % GRADIENTS.length
  const gradient = GRADIENTS[idx]
  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} gap-2`}>
      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
        {inicial}
      </div>
      <span className="text-white/80 text-xs font-medium tracking-wide uppercase">{ciudad}</span>
    </div>
  )
}

export default function ClinicCard({ clinic, distanciaKm, priority = false }: Props) {
  const isPremium = clinic.plan === 'Premium'
  // «Urgencias» sin 24 h se confundía con la insignia «24h»: en la tarjeta no se enseña
  const especialidades = clinic.especialidades.filter((e) => e !== 'Urgencias')
  const tel = clinic.telefono?.replace(/[^\d+]/g, '')

  // Toda la tarjeta lleva a la ficha (el enlace del nombre se estira por encima con
  // after:inset-0); el botón de llamar va aparte, por encima de ese enlace.
  return (
    <article
      className={`group relative rounded-2xl overflow-hidden border bg-white hover:shadow-lg transition-all duration-200 ${
        isPremium ? 'border-amber-300 shadow-amber-100 shadow-md' : 'border-gray-200'
      }`}
    >
      {/* Imagen portada */}
      <div className="relative h-44 bg-gray-100">
        {clinic.fotoPortada ? (
          <>
            <Image
              src={clinic.fotoPortada.miniatura ?? clinic.fotoPortada.url}
              alt={`Foto de ${clinic.nombre}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
            />
            {clinic.fotoPortada.deGoogle && <AtribucionFoto />}
          </>
        ) : (
          <ClinicPlaceholder nombre={clinic.nombre} ciudad={nombreCiudad(clinic.ciudad)} />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isPremium && (
            <span className="bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <Star size={10} className="fill-amber-900" /> Premium
            </span>
          )}
          {clinic.verificada && (
            <span className="bg-teal-700 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck size={10} /> Verificada
            </span>
          )}
          {clinic.urgencias24h && (
            <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <Zap size={10} /> 24h
            </span>
          )}
        </div>

        {/* Distancia (solo en "Cerca de mí") */}
        {distanciaKm !== undefined && (
          <span className="absolute bottom-3 right-3 bg-white/95 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Navigation size={11} className="fill-teal-600" /> a {distanciaKm.toLocaleString('es-ES')} km
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 group-hover:text-teal-700 transition-colors">
          <Link
            href={`/clinicas/${clinic.slug}`}
            className="after:absolute after:inset-0 after:z-[1] after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-teal-500"
          >
            {clinic.nombre}
          </Link>
        </h3>

        {/* Valoración */}
        {clinic.valoracionMedia && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-gray-700">{clinic.valoracionMedia.toFixed(1)}</span>
          </div>
        )}

        {/* Dirección */}
        <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-1">
          <MapPin size={13} className="mt-0.5 shrink-0 text-teal-500" />
          {/* La ciudad delante: la dirección se corta a una línea y muchas no la incluyen */}
          <span className="line-clamp-1">
            <span className="font-medium text-gray-600">{nombreCiudad(clinic.ciudad)}</span>
            {clinic.direccion && <> · {clinic.direccion.replace(/,?\s*(España|Spain)\s*$/i, '')}</>}
          </span>
        </div>

        {/* Teléfono: se puede llamar desde el listado */}
        {clinic.telefono && (
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
            <Phone size={13} className="shrink-0 text-teal-500" />
            <span>{clinic.telefono}</span>
            {tel && tel.replace(/\D/g, '').length >= 9 && (
              <a
                href={`tel:${tel}`}
                aria-label={`Llamar a ${clinic.nombre}`}
                className="relative z-[2] ml-auto shrink-0 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50"
              >
                Llamar
              </a>
            )}
          </div>
        )}

        {/* Horario */}
        {clinic.horario && (
          <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-3">
            <Clock size={13} className="mt-0.5 shrink-0 text-teal-500" />
            <HorarioHoy horario={clinic.horario} canarias={comunidadDeCiudad(clinic.ciudad) === 'Canarias'} />
          </div>
        )}

        {/* Especialidades */}
        {especialidades.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {especialidades.slice(0, 3).map((esp) => (
              <span
                key={esp}
                className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full"
              >
                {esp}
              </span>
            ))}
            {especialidades.length > 3 && (
              <span className="text-xs text-gray-500">
                +{especialidades.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
