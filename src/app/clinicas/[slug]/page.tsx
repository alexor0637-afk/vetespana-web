import type { Metadata } from 'next'
import Image from 'next/image'
import Link from '@/components/Enlace'
import { notFound } from 'next/navigation'
import {
  MapPin, Phone, Globe, Mail, Clock, ShieldCheck,
  Star, Zap, ArrowLeft, MessageCircle, Share2
} from 'lucide-react'
import { getAllClinicSlugs, getClinicBySlug, getReviewsByClinic } from '@/lib/datos'
import { GUIAS } from '@/data/guias'
import ReviewForm from '@/components/ReviewForm'
import SolicitarCambios from '@/components/SolicitarCambios'
import BadgeBox from '@/components/BadgeBox'

// Web estática: se genera una ficha por clínica en el build (datos de Postgres).
export const dynamicParams = false

const SITIO = 'https://www.vetespana.es'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return (await getAllClinicSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const clinic = await getClinicBySlug(slug)
  if (!clinic) return {}

  // Descripción meta única: combina descripción de Airtable + datos clave
  const espDestacadas = clinic.especialidades.filter((e) => !['Perros', 'Gatos'].includes(e)).slice(0, 3)
  const metaDesc = clinic.descripcion
    ? clinic.descripcion.substring(0, 155)
    : [
        `${clinic.nombre} — veterinario en ${clinic.ciudad}.`,
        clinic.urgencias24h ? 'Urgencias 24h.' : '',
        espDestacadas.length ? `Especialidades: ${espDestacadas.join(', ')}.` : 'Consultas, vacunas y cirugía.',
        clinic.telefono ? `Tel: ${clinic.telefono}.` : '',
      ].filter(Boolean).join(' ').substring(0, 155)

  const title = clinic.urgencias24h
    ? `${clinic.nombre} — Veterinario 24h en ${clinic.ciudad}`
    : `${clinic.nombre} — Clínica veterinaria en ${clinic.ciudad}`

  return {
    title,
    description: metaDesc,
    alternates: {
      canonical: `https://www.vetespana.es/clinicas/${slug}`,
    },
    openGraph: {
      title: clinic.nombre,
      description: metaDesc,
      url: `https://www.vetespana.es/clinicas/${slug}`,
      images: clinic.fotoPortada ? [{ url: SITIO + clinic.fotoPortada.url, alt: `Clínica veterinaria ${clinic.nombre}` }] : [],
    },
  }
}

const GRADIENTS = [
  'from-teal-400 to-cyan-600',
  'from-emerald-400 to-teal-600',
  'from-cyan-400 to-blue-600',
  'from-teal-500 to-emerald-700',
  'from-blue-400 to-teal-600',
  'from-green-400 to-emerald-600',
]

function PagePlaceholder({ nombre, ciudad }: { nombre: string; ciudad: string }) {
  const idx = nombre.charCodeAt(0) % GRADIENTS.length
  const gradient = GRADIENTS[idx]
  const inicial = nombre.charAt(0).toUpperCase()
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} gap-3`}>
      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-4xl shadow-inner">
        {inicial}
      </div>
      <span className="text-white/80 text-sm font-medium tracking-widest uppercase">{ciudad}</span>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  )
}

export default async function ClinicaPage({ params }: Props) {
  const { slug } = await params
  const clinic = await getClinicBySlug(slug)
  if (!clinic) notFound()

  const reviews = await getReviewsByClinic(clinic.id)

  // Guías relevantes para enlazar desde la ficha (urgencias primero si las tiene)
  const slugsGuias = (
    clinic.urgencias24h
      ? ['urgencias-veterinarias-24h', 'como-elegir-clinica-veterinaria', 'calendario-vacunas-perros-gatos', 'cuanto-cuesta-veterinario']
      : ['como-elegir-clinica-veterinaria', 'calendario-vacunas-perros-gatos', 'cuanto-cuesta-veterinario', 'alimentos-prohibidos-perros-gatos']
  )
  const guiasFicha = slugsGuias
    .map((s) => GUIAS.find((g) => g.slug === s))
    .filter((g): g is (typeof GUIAS)[number] => Boolean(g))

  const isPremium = clinic.plan === 'Premium'
  const whatsappNumero = (clinic.whatsapp ?? clinic.telefono ?? '').replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/${whatsappNumero.startsWith('34') ? '' : '34'}${whatsappNumero}`

  // JSON-LD para SEO — VeterinaryCare con horario y descripción
  // Parsea las líneas de horario en OpeningHoursSpecification
  const DAYS_ES: Record<string, string> = {
    lunes: 'Monday', martes: 'Tuesday', miércoles: 'Wednesday', miercoles: 'Wednesday',
    jueves: 'Thursday', viernes: 'Friday', sábado: 'Saturday', sabado: 'Saturday', domingo: 'Sunday',
  }
  const openingHours: { '@type': string; dayOfWeek: string | string[]; opens: string; closes: string }[] = []
  if (clinic.horario) {
    for (const line of clinic.horario.split('\n')) {
      const m = line.match(/^(\w+):\s*(\d{1,2}[:–\-]\d{2})[\s–\-–]+(\d{1,2}[:–\-]\d{2})/i)
      if (!m) continue
      const day = DAYS_ES[m[1].toLowerCase()]
      if (!day) continue
      const fmt = (t: string) => t.replace(/[^\d:]/g, ':').replace(/^(\d):/, '0$1:')
      openingHours.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: day, opens: fmt(m[2]), closes: fmt(m[3]) })
    }
  }

  // Normaliza la web de la clínica a una URL absoluta válida (en Airtable a veces
  // está sin "https://"), para que el dato estructurado no salga roto.
  const webAbsoluta = clinic.web
    ? clinic.web.startsWith('http')
      ? clinic.web
      : `https://${clinic.web}`
    : undefined
  const fichaUrl = `https://www.vetespana.es/clinicas/${slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: clinic.nombre,
    description: clinic.descripcion ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.direccion,
      addressLocality: clinic.ciudad,
      addressCountry: 'ES',
    },
    telephone: clinic.telefono,
    url: webAbsoluta ?? fichaUrl,
    sameAs: webAbsoluta ? [fichaUrl] : undefined,
    image: clinic.fotoPortada ? SITIO + clinic.fotoPortada.url : undefined,
    openingHoursSpecification: openingHours.length ? openingHours : undefined,
    // Solo declaramos valoración a Google si hay reseñas REALES visibles en la
    // página. Declarar estrellas sin reseñas visibles viola la política de Google
    // y puede provocar una acción manual que quite todas las estrellas del sitio.
    aggregateRating:
      clinic.valoracionMedia && reviews.length > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: clinic.valoracionMedia,
            reviewCount: reviews.length,
          }
        : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/clinicas" className="hover:text-teal-600 flex items-center gap-1">
            <ArrowLeft size={14} /> Clínicas
          </Link>
          <span>/</span>
          <span className="text-gray-700">{clinic.nombre}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Foto portada */}
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
              {clinic.fotoPortada ? (
                <Image
                  src={clinic.fotoPortada.url}
                  alt={`Clínica veterinaria ${clinic.nombre}`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : (
                <PagePlaceholder nombre={clinic.nombre} ciudad={clinic.ciudad} />
              )}
            </div>

            {/* Nombre y badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {isPremium && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Star size={10} className="fill-amber-600" /> Premium
                  </span>
                )}
                {clinic.verificada && (
                  <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={10} /> Verificada
                  </span>
                )}
                {clinic.urgencias24h && (
                  <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Zap size={10} /> Urgencias 24h
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-1">{clinic.nombre}</h1>
              <p className="text-gray-500 flex items-center gap-1.5">
                <MapPin size={15} className="text-teal-500" />
                {clinic.direccion}, {clinic.ciudad}
              </p>

              {clinic.valoracionMedia && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={clinic.valoracionMedia} />
                  <span className="font-semibold text-gray-700">{clinic.valoracionMedia.toFixed(1)}</span>
                  <span className="text-sm text-gray-600">({reviews.length} reseña{reviews.length !== 1 ? 's' : ''})</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            {clinic.descripcion && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="font-bold text-gray-900 mb-3">Sobre la clínica</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{clinic.descripcion}</p>
              </div>
            )}

            {/* Especialidades */}
            {clinic.especialidades.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="font-bold text-gray-900 mb-3">Especialidades</h2>
                <div className="flex flex-wrap gap-2">
                  {clinic.especialidades.map((esp) => (
                    <Link
                      key={esp}
                      href={`/clinicas?especialidad=${encodeURIComponent(esp)}&ciudad=${encodeURIComponent(clinic.ciudad)}`}
                      className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                    >
                      {esp}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Galería fotos (solo Premium) */}
            {isPremium && clinic.galeriaFotos.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="font-bold text-gray-900 mb-3">Galería de fotos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {clinic.galeriaFotos.map((foto) => (
                    <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden">
                      <Image
                        src={foto.url}
                        alt={`Foto de ${clinic.nombre}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="200px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reseñas */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-4">
                Reseñas {reviews.length > 0 && <span className="text-gray-600 font-normal">({reviews.length})</span>}
              </h2>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-800">{review.nombreUsuario}</span>
                        <span className="text-xs text-gray-600">{new Date(review.fecha).toLocaleDateString('es-ES')}</span>
                      </div>
                      <StarRating rating={review.puntuacion} />
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comentario}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Todavía no hay reseñas para esta clínica. ¡Sé el primero en opinar!</p>
              )}

              <ReviewForm clinicId={clinic.id} clinicSlug={clinic.slug} clinicNombre={clinic.nombre} />
            </div>

            {/* Sello para que la clínica lo ponga en su web → backlink hacia su ficha */}
            <BadgeBox slug={clinic.slug} nombre={clinic.nombre} />

            {/* Guías útiles — enlaces internos hacia el contenido */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-3">Guías para cuidar de tu mascota</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {guiasFicha.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/guias/${g.slug}`}
                    className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-teal-50 transition-colors"
                  >
                    <span className="text-xl shrink-0">{g.emoji}</span>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{g.titulo}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Columna lateral — datos de contacto.
              El sticky va en TODA la columna (contacto + Google Maps) para que el
              botón de Maps se mueva junto al panel y no quede tapado al hacer scroll.
              En móvil se desactiva el sticky (lg:) para que fluya normal. */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Contacto</h2>

              <div className="space-y-3 text-sm">
                {clinic.telefono && (
                  <a
                    href={`tel:${clinic.telefono}`}
                    className="flex items-center gap-3 text-gray-700 hover:text-teal-600 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center group-hover:bg-teal-100">
                      <Phone size={14} className="text-teal-600" />
                    </div>
                    <span className="font-medium">{clinic.telefono}</span>
                  </a>
                )}

                {clinic.direccion && (
                  <div className="flex items-start gap-3 text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={14} className="text-gray-400" />
                    </div>
                    <span>{clinic.direccion}, {clinic.ciudad}</span>
                  </div>
                )}

                {clinic.horario && (
                  <div className="flex items-start gap-3 text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={14} className="text-gray-400" />
                    </div>
                    <span className="whitespace-pre-line">{clinic.horario}</span>
                  </div>
                )}

                {clinic.web && (
                  <a
                    href={clinic.web.startsWith('http') ? clinic.web : `https://${clinic.web}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-teal-600 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-teal-50">
                      <Globe size={14} className="text-gray-400 group-hover:text-teal-600" />
                    </div>
                    <span className="truncate">{clinic.web.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}

                {clinic.email && (
                  <a
                    href={`mailto:${clinic.email}`}
                    className="flex items-center gap-3 text-gray-700 hover:text-teal-600 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-teal-50">
                      <Mail size={14} className="text-gray-400 group-hover:text-teal-600" />
                    </div>
                    <span className="truncate">{clinic.email}</span>
                  </a>
                )}

                {clinic.redesSociales && (
                  <a
                    href={clinic.redesSociales.startsWith('http') ? clinic.redesSociales : `https://${clinic.redesSociales}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-700 hover:text-teal-600 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-teal-50">
                      <Share2 size={14} className="text-gray-400 group-hover:text-teal-600" />
                    </div>
                    <span className="truncate">{clinic.redesSociales.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>

              {/* Botones de acción */}
              <div className="mt-5 space-y-2">
                {clinic.telefono && (
                  <a
                    href={`tel:${clinic.telefono}`}
                    className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    <Phone size={15} /> Llamar ahora
                  </a>
                )}

                {/* WhatsApp: si la clínica ha indicado WhatsApp, o si es Premium */}
                {(clinic.whatsapp || (isPremium && clinic.telefono)) && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Mapa enlace Google Maps */}
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(clinic.nombre + ' ' + clinic.direccion + ' ' + clinic.ciudad)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full bg-white border border-gray-200 hover:border-teal-300 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm justify-center"
            >
              <MapPin size={14} className="text-teal-500" /> Ver en Google Maps
            </a>

            {/* Para el equipo de la clínica: pedir cambios (se revisan antes de publicarse) */}
            <SolicitarCambios
              clinica={{
                id: clinic.id,
                slug: clinic.slug,
                nombre: clinic.nombre,
                ciudad: clinic.ciudad,
                direccion: clinic.direccion,
                telefono: clinic.telefono,
                whatsapp: clinic.whatsapp,
                email: clinic.email,
                web: clinic.web,
                redesSociales: clinic.redesSociales,
                especialidades: clinic.especialidades,
                horario: clinic.horario,
                urgencias24h: clinic.urgencias24h,
                descripcion: clinic.descripcion,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
