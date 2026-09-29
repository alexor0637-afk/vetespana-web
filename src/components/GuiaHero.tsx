import Image from 'next/image'

// Cabecera visual de cada guía: foto real de fondo con degradado teal encima
// para que el título (blanco) se lea bien. La foto se aloja en /public (local).

export default function GuiaHero({
  img,
  alt,
  emoji,
  titulo,
  meta,
}: {
  img: string
  alt: string
  emoji: string
  titulo: string
  meta: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl h-60 md:h-80 mb-8 bg-teal-800">
      <Image src={img} alt={alt} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
      {/* Degradado para legibilidad del texto (más oscuro abajo, donde va el título) */}
      <div className="absolute inset-0 bg-gradient-to-t from-teal-950/95 via-teal-900/65 to-teal-900/15" />
      <div className="relative h-full flex flex-col justify-end p-6 md:p-8">
        <div className="mb-3 w-12 h-12 rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm flex items-center justify-center text-2xl">
          {emoji}
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight drop-shadow-sm">{titulo}</h1>
        <p className="text-teal-50/90 text-sm mt-2">{meta}</p>
      </div>
    </div>
  )
}
