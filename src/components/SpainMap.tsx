import Link from '@/components/Enlace'
import { COMUNIDAD_EMOJI, nombreComunidad } from '@/types/clinic'
import { ciudadSlug } from '@/lib/ciudad-slug'
import mapData from '@/data/spain-paths.json'

const { width, height, paths, canariasRect } = mapData as {
  width: number
  height: number
  paths: Record<string, string>
  canariasRect: { x: number; y: number; w: number; h: number }
}

/**
 * Mapa de comunidades. Sin JavaScript: el resaltado y el recuadro de la comunidad
 * activa salen solo con CSS (:hover, :focus-visible y :has), así el navegador no
 * descarga otra vez los trazados que ya van en el HTML.
 */
export default function SpainMap({ clinicasPorComunidad = {} }: { clinicasPorComunidad?: Record<string, number> }) {
  const comunidades = Object.keys(paths)
  // Recuadro de cada comunidad: se muestra cuando su enlace está bajo el ratón o con el foco
  const css = comunidades
    .map((c) => {
      const s = ciudadSlug(c)
      return `.mapa-es:has([data-c="${s}"]:hover) [data-p="${s}"],.mapa-es:has([data-c="${s}"]:focus-visible) [data-p="${s}"]{opacity:1}`
    })
    .join('')
  const clinicas = (c: string) => {
    const n = clinicasPorComunidad[c]
    return n === undefined ? '' : n === 1 ? '1 clínica · ' : `${n.toLocaleString('es-ES')} clínicas · `
  }

  return (
    <div className="mapa-es relative">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Recuadros flotantes (uno por comunidad; se ve el de la activa) */}
      {comunidades.map((c) => (
        <div key={c} data-p={ciudadSlug(c)} aria-hidden className="pointer-events-none absolute top-3 left-3 z-10 opacity-0 transition-opacity duration-150">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur border border-teal-200 shadow-lg rounded-xl px-3 py-2">
            <span className="text-xl">{COMUNIDAD_EMOJI[c] ?? '📍'}</span>
            <div>
              <div className="text-sm font-semibold text-gray-900 leading-tight">{nombreComunidad(c)}</div>
              <div className="text-xs text-teal-700 leading-tight">{clinicas(c)}Ver clínicas →</div>
            </div>
          </div>
        </div>
      ))}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[560px] mx-auto block"
        role="group"
        aria-label="Mapa de las comunidades autónomas de España"
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
          aria-hidden
        />
        <text
          x={canariasRect.x + 8}
          y={canariasRect.y + canariasRect.h - 8}
          className="fill-teal-600 text-[11px] font-medium"
          aria-hidden
        >
          Canarias
        </text>

        {comunidades.map((comunidad) => (
          <Link
            key={comunidad}
            href={`/comunidades/${ciudadSlug(comunidad)}`}
            aria-label={`Ver clínicas veterinarias en ${nombreComunidad(comunidad)}`}
            data-c={ciudadSlug(comunidad)}
            className="group outline-none"
          >
            <path
              d={paths[comunidad]}
              className="cursor-pointer fill-teal-100 stroke-teal-300 transition-colors duration-150 group-hover:fill-teal-500 group-hover:stroke-white group-focus-visible:fill-teal-500 group-focus-visible:stroke-teal-900"
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
          </Link>
        ))}
      </svg>

      <p className="text-center text-xs text-gray-500 mt-2">
        Pulsa sobre una comunidad autónoma para ver sus clínicas veterinarias
      </p>

      {/* En el móvil las comunidades pequeñas son difíciles de pulsar: también en lista */}
      <ul className="mt-4 flex flex-wrap justify-center gap-2 sm:hidden">
        {comunidades
          .slice()
          .sort((a, b) => nombreComunidad(a).localeCompare(nombreComunidad(b), 'es'))
          .map((c) => (
            <li key={c}>
              <Link
                href={`/comunidades/${ciudadSlug(c)}`}
                className="inline-block rounded-full border border-teal-200 bg-white px-3 py-1.5 text-sm text-teal-800"
              >
                {nombreComunidad(c)}
              </Link>
            </li>
          ))}
      </ul>
    </div>
  )
}
