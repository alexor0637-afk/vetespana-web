import type { Clinic } from '@/types/clinic'
import { ESPECIALIDADES } from '@/types/clinic'

// Índice compacto de TODAS las clínicas para el navegador: lo usan los filtros de
// /clinicas, el scroll infinito de los listados y "Cerca de mí". Se genera en el
// build como archivo estático (/datos/clinicas.json) y solo lleva lo que pinta la
// tarjeta, con claves posicionales para que pese poco.

export const URL_INDICE = '/datos/clinicas.json'

// [id, slug, nombre, ciudad, dirección, teléfono, 1ª línea del horario,
//  especialidades (índices de ESPECIALIDADES), marcas, valoración, foto, lat, lng]
export type FilaIndice = [
  string, string, string, string, string, string, string,
  number[], number, number, string, number | null, number | null,
]

const URGENCIAS = 1
const PREMIUM = 2
const VERIFICADA = 4

export function aIndice(clinicas: Clinic[]): FilaIndice[] {
  return clinicas.map((c) => [
    c.id,
    c.slug,
    c.nombre,
    c.ciudad,
    c.direccion,
    c.telefono,
    (c.horario ?? '').split('\n')[0],
    c.especialidades.map((e) => ESPECIALIDADES.indexOf(e as (typeof ESPECIALIDADES)[number])).filter((i) => i >= 0),
    (c.urgencias24h ? URGENCIAS : 0) | (c.plan === 'Premium' ? PREMIUM : 0) | (c.verificada ? VERIFICADA : 0),
    c.valoracionMedia ?? 0,
    c.fotoPortada?.url ?? '',
    c.lat ?? null,
    c.lng ?? null,
  ])
}

export function desdeIndice(filas: FilaIndice[]): Clinic[] {
  return filas.map(([id, slug, nombre, ciudad, direccion, telefono, horario, esp, marcas, valoracion, foto, lat, lng]) => ({
    id,
    slug,
    nombre,
    ciudad,
    direccion,
    telefono,
    horario: horario || undefined,
    especialidades: esp.map((i) => ESPECIALIDADES[i]),
    urgencias24h: (marcas & URGENCIAS) !== 0,
    plan: marcas & PREMIUM ? 'Premium' : 'Gratis',
    verificada: (marcas & VERIFICADA) !== 0,
    valoracionMedia: valoracion || undefined,
    fotoPortada: foto ? { id: foto, url: foto, filename: foto } : undefined,
    galeriaFotos: [],
    lat: lat ?? undefined,
    lng: lng ?? undefined,
  }))
}

// En el navegador: se descarga una sola vez por página y se reutiliza.
let promesa: Promise<Clinic[]> | null = null
export function cargarIndice(): Promise<Clinic[]> {
  promesa ??= fetch(URL_INDICE)
    .then((r) => {
      if (!r.ok) throw new Error(`No se pudo cargar ${URL_INDICE}: ${r.status}`)
      return r.json() as Promise<FilaIndice[]>
    })
    .then(desdeIndice)
    .catch((e) => {
      promesa = null // permite reintentar
      throw e
    })
  return promesa
}
