import type { Clinic } from '@/tipos/clinica'
import { CIUDADES_POR_COMUNIDAD, CIUDAD_DISPLAY, ESPECIALIDADES } from '@/tipos/clinica'

// Búsqueda + filtros + orden del listado. Es una función PURA (no lee ninguna base):
// la usan tanto las páginas generadas en el build como el navegador, que filtra
// el índice /datos/clinicas.json (filtros de /clinicas y scroll infinito).
// Así el orden del servidor y el del navegador son siempre el mismo.

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// ¿Distancia de edición ≤ 1? (una letra cambiada, sobrante o que falta). En una sola
// pasada y sin reservar memoria: la búsqueda libre lo llama miles de veces.
function casiIgual(a: string, b: string): boolean {
  const la = a.length, lb = b.length
  if (Math.abs(la - lb) > 1) return false
  let i = 0, j = 0, dif = 0
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++dif > 1) return false
    if (la > lb) i++
    else if (la < lb) j++
    else { i++; j++ }
  }
  return dif + (la - i) + (lb - j) <= 1
}

// Cada texto normalizado y partido en palabras una sola vez (los campos se repiten en
// cada búsqueda y en cada «Ver más»)
const normalizados = new Map<string, { texto: string; palabras: string[] }>()
function normalizado(campo: string) {
  let r = normalizados.get(campo)
  if (!r) {
    const texto = norm(campo)
    r = { texto, palabras: texto.split(/[\s,.\-/]+/) }
    if (normalizados.size < 50000) normalizados.set(campo, r)
  }
  return r
}

// true si el campo contiene la palabra (sin tildes) o hay una palabra con
// distancia de edición ≤ 1 (tolerante a 1 typo en palabras de > 3 letras).
function fuzzyField(field: string, word: string): boolean {
  const { texto, palabras } = normalizado(field)
  if (texto.includes(word)) return true
  return word.length > 3 && palabras.some((t) => casiIgual(t, word))
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

// Lo completa que está la ficha: primero las que más ayudan a quien busca veterinario.
// OJO: solo con datos que también lleva el índice del navegador (lib/indice.ts), para
// que el orden del HTML y el del «Ver más» sean el mismo.
function completitud(c: Clinic): number {
  // (del horario se mira solo que tenga primera línea)
  return (c.fotoPortada ? 3 : 0) + (c.telefono ? 2 : 0) + (c.horario?.split('\n')[0] ? 2 : 0) + (c.urgencias24h ? 1 : 0)
}

// Nombre para ordenar: sin tildes y sin comillas, puntos o símbolos delante
const claveNombre = (c: Clinic) => norm(c.nombre).replace(/^[^a-z0-9]+/, '')

export function ordenarClinicas(clinicas: Clinic[], orden?: string): Clinic[] {
  const porNombre = (a: Clinic, b: Clinic) => claveNombre(a).localeCompare(claveNombre(b), 'es')
  const porCompletitud = (a: Clinic, b: Clinic) => completitud(b) - completitud(a)
  const porValoracion = (a: Clinic, b: Clinic) => (b.valoracionMedia ?? 0) - (a.valoracionMedia ?? 0)
  if (orden === 'nombre') return [...clinicas].sort((a, b) => basePriority(a, b) || porNombre(a, b))
  if (orden === 'valoracion') {
    return [...clinicas].sort((a, b) => basePriority(a, b) || porValoracion(a, b) || porCompletitud(a, b) || porNombre(a, b))
  }
  // Relevancia: ficha más completa y, a igualdad, nombre (orden estable entre builds)
  return [...clinicas].sort((a, b) => basePriority(a, b) || porCompletitud(a, b) || porNombre(a, b))
}

// ── Búsqueda libre ───────────────────────────────────────────────────────────
// Palabras que no ayudan a buscar (todas las fichas son de veterinarios)
const VACIAS = new Set([
  'veterinario', 'veterinaria', 'veterinarios', 'veterinarias', 'vet', 'clinica', 'clinicas', 'centro',
  'centros', 'en', 'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'para', 'con', 'mi', 'cerca', 'buen',
  'bueno', 'buena', 'mejor', 'mejores', 'horas', 'hora', 'abierto', 'abierta',
])

// Palabras que equivalen a una especialidad («dermatólogo» → Dermatología)
const SINONIMOS: [RegExp, string][] = [
  [/^(dermatolog\w*|piel|alergias?)$/, 'Dermatología'],
  [/^(odontolog\w*|dentistas?|dental\w*|dientes?)$/, 'Odontología'],
  [/^(cardiolog\w*|corazon)$/, 'Cardiología'],
  [/^(oncolog\w*|cancer|tumor\w*)$/, 'Oncología'],
  [/^(traumatolog\w*|fracturas?|huesos?)$/, 'Traumatología'],
  [/^(cirug\w*|ciruj\w*|operacion\w*|esteriliza\w*|castra\w*)$/, 'Cirugía'],
  [/^(exotic\w*|conejos?|hurones?|roedores?)$/, 'Animales exóticos'],
  [/^(reptil\w*|tortugas?|serpientes?|iguanas?)$/, 'Reptiles'],
  [/^(aves|pajaros?|loros?|periquitos?)$/, 'Aves'],
  [/^(hospitaliza\w*|ingresos?)$/, 'Hospitalización'],
  [/^(perros?|canin\w*|cachorros?)$/, 'Perros'],
  [/^(gatos?|felin\w*)$/, 'Gatos'],
]

// ¿La clínica cumple una palabra de la búsqueda?
function cumplePalabra(c: Clinic, word: string): boolean {
  // «24h», «24», «24/7»: solo las de urgencias 24 horas
  if (/^24(h|horas)?$|^24\/7$/.test(word)) return c.urgencias24h
  // «urgencias»: las de 24 h y las que atienden urgencias en su horario
  if (/^urgen(cias?|tes?)$/.test(word)) return c.urgencias24h || c.especialidades.includes('Urgencias')
  const sinonimo = SINONIMOS.find(([re]) => re.test(word))
  if (sinonimo && c.especialidades.includes(sinonimo[1])) return true
  return (
    fuzzyField(c.nombre, word) ||
    fuzzyField(c.ciudad, word) ||
    fuzzyField(CIUDAD_DISPLAY[c.ciudad] ?? '', word) ||
    c.especialidades.some((e) => fuzzyField(e, word)) ||
    fuzzyField(c.direccion ?? '', word)
  )
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

  // Búsqueda libre tolerante a tildes y a 1 typo por palabra, sin palabras vacías
  const queryWords = norm(params.q?.trim() ?? '').split(/\s+/).filter((w) => w && !VACIAS.has(w))
  if (queryWords.length) {
    lista = lista.filter((c) => queryWords.every((word) => cumplePalabra(c, word)))
  }
  return ordenarClinicas(lista, params.orden)
}

// Valores conocidos: un filtro inventado en la URL se ignora (si no, su texto acabaría
// en el título y en los textos de la página). Se aceptan también sin tildes o con el
// nombre bonito de la ciudad (?ciudad=logroño → Logrono).
const porNorm = (valores: readonly string[], extra: Record<string, string> = {}) =>
  new Map([
    ...valores.map((v) => [norm(v), v] as const),
    ...Object.entries(extra).map(([clave, bonito]) => [norm(bonito), clave] as const),
  ])
const CIUDADES = porNorm(Object.values(CIUDADES_POR_COMUNIDAD).flat(), CIUDAD_DISPLAY)
const COMUNIDADES_VALIDAS = porNorm(Object.keys(CIUDADES_POR_COMUNIDAD))
const ESPECIALIDADES_VALIDAS = porNorm(ESPECIALIDADES)
const valido = (mapa: Map<string, string>, v: string | null) => (v ? mapa.get(norm(v.trim())) : undefined)

// Lee los filtros de la URL (?ciudad=&comunidad=&especialidad=&urgencias=1&q=&orden=)
export function paramsDesdeUrl(sp: { get(nombre: string): string | null }): SearchParams {
  const orden = sp.get('orden')
  return {
    ciudad: valido(CIUDADES, sp.get('ciudad')),
    comunidad: valido(COMUNIDADES_VALIDAS, sp.get('comunidad')),
    especialidad: valido(ESPECIALIDADES_VALIDAS, sp.get('especialidad')),
    urgencias: sp.get('urgencias') === '1',
    q: sp.get('q') ?? undefined,
    orden: orden === 'nombre' || orden === 'valoracion' ? orden : undefined,
  }
}
