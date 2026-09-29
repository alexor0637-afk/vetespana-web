import { Client } from 'pg'
import type { Clinic, ClinicPhoto, Review } from '@/types/clinic'
import { CIUDADES_POR_COMUNIDAD } from '@/types/clinic'
import { ciudadSlug } from '@/lib/ciudad-slug'
import { filtrarClinicas, ordenarClinicas, type SearchParams } from '@/lib/search'

// Capa de datos de la web: lee la base Postgres "vetespana" SOLO al generar la web
// (next build, en el servidor de casa). La web publicada son archivos estáticos y
// no se conecta a ninguna base. Se lee todo UNA vez por proceso de build.
//
// DATABASE_URL: postgresql://vetespana_lectura:…@postgres:5432/vetespana (rol de solo lectura)

const URL_FOTOS = '/fotos/'

// Slug de la base → valor de ciudad que usa la web (CIUDADES_POR_COMUNIDAD en clinic.ts).
const CIUDAD_POR_SLUG_BD = new Map(
  Object.values(CIUDADES_POR_COMUNIDAD).flat().map((ciudad) => [ciudadSlug(ciudad), ciudad])
)

type FilaClinica = {
  id: string
  slug: string
  nombre: string
  ciudad_slug: string
  direccion: string | null
  telefono: string | null
  whatsapp: string | null
  email: string | null
  web: string | null
  redes_sociales: string | null
  horario: string | null
  descripcion: string | null
  urgencias_24h: boolean
  verificada: boolean
  plan: 'Gratis' | 'Premium'
  lat: number | null
  lng: number | null
  actualizado: Date
  especialidades: string[]
  fotos: { archivo: string; tipo: 'portada' | 'galeria'; ancho: number | null; alto: number | null; origen: string | null }[]
}

type FilaResena = {
  id: string
  clinica_id: string
  nombre_usuario: string | null
  puntuacion: number
  comentario: string | null
  fecha: string // 'YYYY-MM-DD' (se lee como texto: pg convertiría un date a medianoche LOCAL)
}

interface Datos {
  clinicas: Clinic[] // ordenadas por relevancia
  porSlug: Map<string, Clinic>
  resenas: Map<string, Review[]> // por id de clínica
}

const foto = (f: FilaClinica['fotos'][number]): ClinicPhoto => ({
  id: f.archivo,
  url: URL_FOTOS + f.archivo,
  filename: f.archivo,
  width: f.ancho ?? undefined,
  height: f.alto ?? undefined,
  deGoogle: f.origen === 'google_places', // las que suben las clínicas llevan origen 'subida'
})

async function cargar(): Promise<Datos> {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL: la web se genera leyendo la base Postgres "vetespana"')

  const db = new Client({ connectionString: url })
  await db.connect()
  try {
    const { rows: filas } = await db.query<FilaClinica>(`
      SELECT c.id::text, c.slug, c.nombre, ci.slug AS ciudad_slug, c.direccion, c.telefono, c.whatsapp,
             c.email, c.web, c.redes_sociales, c.horario, c.descripcion, c.urgencias_24h, c.verificada,
             c.plan::text AS plan, c.lat, c.lng, c.updated_at AS actualizado,
             coalesce((SELECT array_agg(e.nombre ORDER BY e.id)
                         FROM clinica_especialidades ce JOIN especialidades e ON e.id = ce.especialidad_id
                        WHERE ce.clinica_id = c.id), '{}') AS especialidades,
             coalesce((SELECT json_agg(json_build_object('archivo', f.archivo, 'tipo', f.tipo, 'ancho', f.ancho, 'alto', f.alto, 'origen', f.origen)
                                  ORDER BY f.tipo, f.orden)
                         FROM fotos f WHERE f.clinica_id = c.id), '[]') AS fotos
      FROM clinicas c
      JOIN ciudades ci ON ci.id = c.ciudad_id`)
    const { rows: filasResenas } = await db.query<FilaResena>(`
      SELECT id::text, clinica_id::text, nombre_usuario, puntuacion, comentario, fecha::text
      FROM resenas WHERE aprobada ORDER BY fecha DESC, id DESC`)

    const resenas = new Map<string, Review[]>()
    for (const r of filasResenas) {
      const lista = resenas.get(r.clinica_id) ?? []
      lista.push({
        id: r.id,
        clinicaId: r.clinica_id,
        nombreUsuario: r.nombre_usuario ?? 'Anónimo',
        puntuacion: r.puntuacion,
        comentario: r.comentario ?? '',
        fecha: r.fecha,
        aprobada: true,
      })
      resenas.set(r.clinica_id, lista)
    }

    const sinCiudad = [...new Set(filas.map((f) => f.ciudad_slug).filter((s) => !CIUDAD_POR_SLUG_BD.has(s)))]
    if (sinCiudad.length) {
      throw new Error(`Ciudades de la base que no están en CIUDADES_POR_COMUNIDAD (types/clinic.ts): ${sinCiudad.join(', ')}`)
    }

    const clinicas = filas.map((f): Clinic => {
      const suyas = resenas.get(f.id) ?? []
      const media = suyas.length ? suyas.reduce((s, r) => s + r.puntuacion, 0) / suyas.length : undefined
      const portada = f.fotos.find((x) => x.tipo === 'portada')
      return {
        id: f.id,
        slug: f.slug,
        nombre: f.nombre,
        ciudad: CIUDAD_POR_SLUG_BD.get(f.ciudad_slug)!,
        direccion: f.direccion ?? '',
        telefono: f.telefono ?? '',
        web: f.web ?? undefined,
        email: f.email ?? undefined,
        whatsapp: f.whatsapp ?? undefined,
        redesSociales: f.redes_sociales ?? undefined,
        especialidades: f.especialidades,
        horario: f.horario ?? undefined,
        urgencias24h: f.urgencias_24h,
        fotoPortada: portada ? foto(portada) : undefined,
        galeriaFotos: f.fotos.filter((x) => x.tipo === 'galeria').map(foto),
        descripcion: f.descripcion ?? undefined,
        plan: f.plan,
        valoracionMedia: media !== undefined ? Math.round(media * 10) / 10 : undefined,
        verificada: f.verificada,
        lat: f.lat ?? undefined,
        lng: f.lng ?? undefined,
        actualizado: f.actualizado.toISOString(),
      }
    })

    const ordenadas = ordenarClinicas(clinicas)
    return { clinicas: ordenadas, porSlug: new Map(ordenadas.map((c) => [c.slug, c])), resenas }
  } finally {
    await db.end()
  }
}

let cache: Promise<Datos> | null = null
const datos = () => (cache ??= cargar())

// Versión de tarjeta: sin los campos largos que la tarjeta no pinta (aligera el HTML).
export function aTarjeta(c: Clinic): Clinic {
  return {
    ...c,
    web: undefined,
    email: undefined,
    whatsapp: undefined,
    redesSociales: undefined,
    descripcion: undefined,
    galeriaFotos: [],
  }
}

/** Todas las clínicas completas, ordenadas por relevancia. */
export async function getAllClinics(): Promise<Clinic[]> {
  return (await datos()).clinicas
}

/** Listado filtrado (versión tarjeta). */
export async function searchClinics(params: SearchParams): Promise<Clinic[]> {
  return filtrarClinicas((await datos()).clinicas, params).map(aTarjeta)
}

export async function getFeaturedClinics(): Promise<Clinic[]> {
  return (await datos()).clinicas.slice(0, 6).map(aTarjeta)
}

export async function getClinicBySlug(slug: string): Promise<Clinic | null> {
  return (await datos()).porSlug.get(slug) ?? null
}

export async function getAllClinicSlugs(): Promise<string[]> {
  return (await datos()).clinicas.map((c) => c.slug)
}

export async function getReviewsByClinic(clinicId: string): Promise<Review[]> {
  return (await datos()).resenas.get(clinicId) ?? []
}

/** "2.300" para "Más de 2.300 clínicas": total redondeado hacia abajo a las centenas. */
export async function clinicasMasDe(): Promise<string> {
  const centenas = Math.floor((await datos()).clinicas.length / 100) * 100
  const miles = Math.floor(centenas / 1000)
  return miles ? `${miles}.${String(centenas % 1000).padStart(3, '0')}` : String(centenas)
}
