// Coordenadas de una dirección con OpenStreetMap (Nominatim), gratis, para «Cerca de mí».
// Normas de uso de Nominatim: como mucho 1 petición por segundo e identificarse
// (User-Agent). https://operations.osmfoundation.org/policies/nominatim/
//
// Como módulo (publicar-altas.mjs, aplicar-ediciones.mjs):
//   import { coordenadasDe } from './geocodificar.mjs'
//   await coordenadasDe(db, direccion, ciudadId)   → { lat, lng } o null
// Como script, rellena las clínicas que no tienen coordenadas:
//   node tareas/geocodificar.mjs            (prueba: solo dice lo que haría)
//   node tareas/geocodificar.mjs --aplicar
// Variables: DATABASE_URL_ESCRITURA
import pg from 'pg'
import { pathToFileURL } from 'node:url'

const AGENTE = 'vetespana.es/1.0 (+https://www.vetespana.es)'
const MAX_KM = 30 // más lejos que esto de las demás clínicas de su ciudad = resultado dudoso
const DEMASIADO_GENERAL = new Set([
  'country', 'state', 'region', 'province', 'county', 'municipality', 'city', 'town', 'village',
  'hamlet', 'suburb', 'city_district', 'district', 'borough', 'postcode',
])

const normalizar = (s) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

let ultimaPeticion = 0
async function esperarTurno() {
  const espera = ultimaPeticion + 1100 - Date.now()
  if (espera > 0) await new Promise((r) => setTimeout(r, espera))
  ultimaPeticion = Date.now()
}

// Quita lo que confunde al buscador (piso, local, paréntesis…) y desarrolla abreviaturas
function limpiarDireccion(direccion) {
  return direccion
    .replace(/\([^)]*\)?/g, ' ')
    .replace(/\b(bajos?|local|loc\.|planta|piso|esc\.|escalera|puerta|pta\.|nave|edificio|edif\.)\b[^,]*/gi, ' ')
    .replace(/(^|[\s,])C\/\s*/gi, '$1Calle ')
    .replace(/(^|[\s,])C\.\s+/g, '$1Calle ')
    .replace(/(^|[\s,])(Av|Avda)\.\s*/gi, '$1Avenida ')
    .replace(/(^|[\s,])(Pl|Pza|Plza)\.\s*/gi, '$1Plaza ')
    .replace(/(^|[\s,])Ctra\.\s*/gi, '$1Carretera ')
    .replace(/(^|[\s,])(Tr\.ª|Trva\.|Trav\.)\s*/gi, '$1Travesía ')
    .replace(/(^|[\s,])(P\.º|Pº|Pg\.)\s*/gi, '$1Paseo ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Las direcciones que vienen de Google ya traen código postal, ciudad y país: no se
// repiten (repetidos, Nominatim no encuentra nada). Si no los traen, se añaden.
function consultasPara(direccion, ciudad) {
  const traeLugar = (d) => /\b\d{5}\b/.test(d) || /\b(españa|spain)\b/i.test(d) || normalizar(d).includes(normalizar(ciudad))
  const conLugar = (d) => (traeLugar(d) ? d : `${d}, ${ciudad}, España`)
  const limpia = limpiarDireccion(direccion)
  const calleYNumero = limpia.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 2).join(', ')
  return [...new Set([conLugar(direccion), conLugar(limpia), `${calleYNumero}, ${ciudad}, España`])]
}

function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

async function buscar(texto) {
  await esperarTurno()
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&addressdetails=1&q=${encodeURIComponent(texto)}`
  const res = await fetch(url, { headers: { 'User-Agent': AGENTE, 'Accept-Language': 'es' } })
  if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`)
  const [r] = await res.json()
  return r ?? null
}

/** Coordenadas de la dirección si el resultado es creíble (en su ciudad), si no null */
export async function geocodificar(direccion, ciudad, centro = null) {
  if (!direccion || !ciudad) return null
  for (const q of consultasPara(direccion, ciudad)) {
    const r = await buscar(q)
    if (!r) continue
    // Si solo encuentra la ciudad (no la calle), pondría la clínica en el centro: no vale
    if (DEMASIADO_GENERAL.has(r.addresstype) || r.type === 'administrative') continue
    const punto = { lat: Number(r.lat), lng: Number(r.lon) }
    if (!Number.isFinite(punto.lat) || !Number.isFinite(punto.lng)) continue
    if (centro) {
      if (distanciaKm(centro, punto) > MAX_KM) continue
    } else {
      // Sin otras clínicas en la ciudad para comparar: al menos que el municipio coincida
      const a = r.address ?? {}
      const lugar = normalizar([a.city, a.town, a.village, a.municipality, a.county].filter(Boolean).join(' '))
      if (!lugar.includes(normalizar(ciudad).split(' ')[0])) continue
    }
    return { lat: Math.round(punto.lat * 1e6) / 1e6, lng: Math.round(punto.lng * 1e6) / 1e6 }
  }
  return null
}

/** Con la base: nombre de la ciudad y centro de sus clínicas con coordenadas */
export async function coordenadasDe(db, direccion, ciudadId) {
  const { rows: [c] } = await db.query(
    `SELECT ci.nombre, avg(cl.lat) AS lat, avg(cl.lng) AS lng, count(cl.lat) AS n
       FROM ciudades ci LEFT JOIN clinicas cl ON cl.ciudad_id = ci.id AND cl.lat IS NOT NULL
      WHERE ci.id = $1 GROUP BY ci.nombre`, [ciudadId])
  if (!c) return null
  const centro = Number(c.n) >= 3 ? { lat: Number(c.lat), lng: Number(c.lng) } : null
  try {
    return await geocodificar(direccion, c.nombre, centro)
  } catch (e) {
    console.error(`Coordenadas: ${e.message}`)
    return null
  }
}

// ── Como script: rellenar las clínicas sin coordenadas ───────────────────────
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const aplicar = process.argv.includes('--aplicar')
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL_ESCRITURA })
  await db.connect()
  const { rows } = await db.query(
    `SELECT id, nombre, direccion, ciudad_id FROM clinicas WHERE lat IS NULL OR lng IS NULL ORDER BY id`)
  console.log(`Coordenadas: ${rows.length} clínicas sin coordenadas${aplicar ? '' : ' (prueba: no se guarda nada)'}`)
  let encontradas = 0
  for (const c of rows) {
    const punto = await coordenadasDe(db, c.direccion, c.ciudad_id)
    if (!punto) {
      console.log(`  ✗ ${c.nombre} · ${c.direccion}`)
      continue
    }
    encontradas++
    console.log(`  ✓ ${c.nombre} → ${punto.lat}, ${punto.lng}`)
    if (aplicar) await db.query('UPDATE clinicas SET lat = $2, lng = $3 WHERE id = $1', [c.id, punto.lat, punto.lng])
  }
  await db.end()
  console.log(`Coordenadas: ${encontradas} de ${rows.length} encontradas${aplicar ? ' y guardadas' : ''}`)
}
