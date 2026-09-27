import type { Clinic } from '@/types/clinic'
import { CIUDADES_POR_COMUNIDAD } from '@/types/clinic'

// Búsqueda + filtros + orden del listado. Es una función PURA (no lee ninguna base):
// la usan tanto las páginas generadas en el build como el navegador, que filtra
// el índice /datos/clinicas.json (filtros de /clinicas y scroll infinito).
// Así el orden del servidor y el del navegador son siempre el mismo.

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

// true si el campo contiene la palabra (sin tildes) o hay una palabra con
// distancia de edición ≤ 1 (tolerante a 1 typo en palabras de > 3 letras).
function fuzzyField(field: string, word: string): boolean {
  const f = norm(field)
  if (f.includes(word)) return true
  if (word.length > 3) {
    const tokens = f.split(/[\s,.\-/]+/)
    return tokens.some((t) => Math.abs(t.length - word.length) <= 1 && levenshtein(t, word) <= 1)
  }
  return false
}

export interface SearchParams {
  ciudad?: string
  comunidad?: string
  especialidad?: string
  urgencias?: boolean
  q?: string
  orden?: string
}

// Criterio base: Premium > Verificada. Las verificadas salen SIEMPRE por delante.
function basePriority(a: Clinic, b: Clinic): number {
  if (a.plan !== b.plan) return a.plan === 'Premium' ? -1 : 1
  if (a.verificada !== b.verificada) return a.verificada ? -1 : 1
  return 0
}

export function ordenarClinicas(clinicas: Clinic[], orden?: string): Clinic[] {
  const porNombre = (a: Clinic, b: Clinic) => a.nombre.localeCompare(b.nombre, 'es')
  const porValoracion = (a: Clinic, b: Clinic) => (b.valoracionMedia ?? 0) - (a.valoracionMedia ?? 0)
  if (orden === 'nombre') return [...clinicas].sort((a, b) => basePriority(a, b) || porNombre(a, b))
  // Relevancia y "mejor valoradas": valoración y, a igualdad, nombre (orden estable entre builds)
  return [...clinicas].sort((a, b) => basePriority(a, b) || porValoracion(a, b) || porNombre(a, b))
}

export function filtrarClinicas(clinicas: Clinic[], params: SearchParams): Clinic[] {
  let lista = clinicas
  if (params.ciudad) {
    lista = lista.filter((c) => c.ciudad === params.ciudad)
  } else if (params.comunidad) {
    const ciudades = new Set(CIUDADES_POR_COMUNIDAD[params.comunidad] ?? [])
    lista = lista.filter((c) => ciudades.has(c.ciudad))
  }
  if (params.especialidad) lista = lista.filter((c) => c.especialidades.includes(params.especialidad!))
  if (params.urgencias) lista = lista.filter((c) => c.urgencias24h)

  // Búsqueda libre tolerante a tildes y a 1 typo por palabra
  const queryWords = norm(params.q?.trim() ?? '').split(/\s+/).filter(Boolean)
  if (queryWords.length) {
    lista = lista.filter((c) =>
      queryWords.every((word) =>
        fuzzyField(c.nombre, word) ||
        fuzzyField(c.ciudad, word) ||
        c.especialidades.some((e) => fuzzyField(e, word)) ||
        fuzzyField(c.direccion ?? '', word)
      )
    )
  }
  return ordenarClinicas(lista, params.orden)
}

// Lee los filtros de la URL (?ciudad=&comunidad=&especialidad=&urgencias=1&q=&orden=)
export function paramsDesdeUrl(sp: { get(nombre: string): string | null }): SearchParams {
  return {
    ciudad: sp.get('ciudad') ?? undefined,
    comunidad: sp.get('comunidad') ?? undefined,
    especialidad: sp.get('especialidad') ?? undefined,
    urgencias: sp.get('urgencias') === '1',
    q: sp.get('q') ?? undefined,
    orden: sp.get('orden') ?? undefined,
  }
}
