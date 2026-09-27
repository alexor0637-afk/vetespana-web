'use client'

import Link from '@/components/Enlace'
import { useState } from 'react'
import { CIUDADES_POR_COMUNIDAD, COMUNIDAD_EMOJI } from '@/types/clinic'
import { ciudadSlug } from '@/lib/ciudad-slug'
import mapData from '@/data/spain-paths.json'

const { width, height, paths, canariasRect } = mapData as {
  width: number
  height: number
  paths: Record<string, string>
  canariasRect: { x: number; y: number; w: number; h: number }
}

export default function SpainMap() {
  const [hovered, setHovered] = useState<string | null>(null)

  const comunidades = Object.keys(paths)

  return (
    <div className="relative">
      {/* Panel flotante con la comunidad activa */}
      <div className="pointer-events-none absolute top-3 left-3 z-10 transition-opacity duration-150"
        style={{ opacity: hovered ? 1 : 0 }}>
        {hovered && (
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur border border-teal-200 shadow-lg rounded-xl px-3 py-2">
            <span className="text-xl">{COMUNIDAD_EMOJI[hovered] ?? '📍'}</span>
            <div>
              <div className="text-sm font-semibold text-gray-900 leading-tight">{hovered}</div>
              <div className="text-xs text-teal-600 leading-tight">
                {CIUDADES_POR_COMUNIDAD[hovered]?.length ?? 0}{' '}
                {(CIUDADES_POR_COMUNIDAD[hovered]?.length ?? 0) === 1 ? 'ciudad' : 'ciudades'} · Ver clínicas →
              </div>
            </div>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[560px] mx-auto block"
        role="img"
        aria-label="Mapa interactivo de las comunidades autónomas de España"
      >
        {/* Recuadro de Canarias */}
        <rect
          x={canariasRect.x}
          y={canariasRect.y}
          width={canariasRect.w}
          height={canariasRect.h}
          rx={10}
          className="fill-none stroke-teal-200"
          strokeDasharray="5 4"
        />
        <text
          x={canariasRect.x + 8}
          y={canariasRect.y + canariasRect.h - 8}
          className="fill-teal-400 text-[11px] font-medium"
        >
          Canarias
        </text>

        {comunidades.map((comunidad) => {
          const isHovered = hovered === comunidad
          return (
            <Link
              key={comunidad}
              href={`/comunidades/${ciudadSlug(comunidad)}`}
              aria-label={`Ver clínicas veterinarias en ${comunidad}`}
            >
              <path
                d={paths[comunidad]}
                className={`cursor-pointer transition-all duration-150 ${
                  isHovered
                    ? 'fill-teal-500 stroke-white'
                    : 'fill-teal-100 stroke-teal-300 hover:fill-teal-300'
                }`}
                strokeWidth={isHovered ? 1.5 : 0.8}
                strokeLinejoin="round"
                onMouseEnter={() => setHovered(comunidad)}
                onMouseLeave={() => setHovered((c) => (c === comunidad ? null : c))}
              />
            </Link>
          )
        })}
      </svg>

      <p className="text-center text-xs text-gray-400 mt-2">
        Pulsa sobre una comunidad autónoma para ver sus clínicas veterinarias
      </p>
    </div>
  )
}
