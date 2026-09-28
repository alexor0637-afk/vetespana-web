'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { URL_BUZON } from '@/lib/formulario-clinica'

interface Props {
  clinicId: string
  clinicSlug: string
  clinicNombre: string
}

// Las reseñas van al buzón de Cloudflare (worker/index.ts). El servidor de casa las
// recoge cada 10 minutos y las guarda en Postgres pendientes de aprobar (en NocoDB);
// en cuanto se aprueban, salen en la web en unos minutos.

export default function ReviewForm({ clinicId, clinicSlug, clinicNombre }: Props) {
  const [nombre, setNombre] = useState('')
  const [puntuacion, setPuntuacion] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comentario, setComentario] = useState('')
  const [website, setWebsite] = useState('') // honeypot anti-bots: debe quedar vacío
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!puntuacion) return

    setEstado('loading')
    try {
      const res = await fetch(`${URL_BUZON}/resenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicaId: clinicId, slug: clinicSlug, clinicaNombre: clinicNombre, nombreUsuario: nombre, puntuacion, comentario, website }),
      })
      if (res.ok) {
        setEstado('ok')
      } else {
        setEstado('error')
      }
    } catch {
      setEstado('error')
    }
  }

  if (estado === 'ok') {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 text-center">
        <div className="text-2xl mb-2">🐾</div>
        <p className="font-semibold text-teal-800">¡Gracias por tu reseña!</p>
        <p className="text-sm text-teal-600 mt-1">
          La revisaremos en breve y la publicaremos en la ficha de {clinicNombre}.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-5 mt-2 space-y-4">
      <h3 className="font-semibold text-gray-800">Escribe tu reseña</h3>

      {/* Honeypot: invisible para personas; los bots lo rellenan y la reseña se descarta */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      {/* Selector de estrellas */}
      <div>
        <label className="text-sm text-gray-600 block mb-1.5">Puntuación *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
              onClick={() => setPuntuacion(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              className="focus:outline-none"
            >
              <Star
                size={28}
                className={
                  n <= (hovered || puntuacion)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200'
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="text-sm text-gray-600 block mb-1.5">Tu nombre *</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: María G."
          required
          maxLength={60}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {/* Comentario */}
      <div>
        <label className="text-sm text-gray-600 block mb-1.5">Comentario *</label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Cuéntanos tu experiencia con esta clínica..."
          required
          minLength={10}
          maxLength={500}
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
        />
        <p className="text-xs text-gray-600 mt-1 text-right">{comentario.length}/500</p>
      </div>

      {estado === 'error' && (
        <p className="text-sm text-red-500">Ha ocurrido un error. Inténtalo de nuevo.</p>
      )}

      <button
        type="submit"
        disabled={!puntuacion || !nombre || !comentario || estado === 'loading'}
        className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {estado === 'loading' ? 'Enviando...' : 'Publicar reseña'}
      </button>
      <p className="text-xs text-gray-600 text-center">
        Las reseñas se revisan antes de publicarse.
      </p>
    </form>
  )
}
