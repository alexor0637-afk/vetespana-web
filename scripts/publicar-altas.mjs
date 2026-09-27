// Convierte en clínicas las altas que el dueño ha APROBADO en NocoDB
// (tabla altas, estado = aprobada). Si alguna no se puede publicar (ciudad
// desconocida, sin nombre…) se deja como está y se explica en su columna `nota`.
//
// Se ejecuta en cada publicación (contenedor de ~/homelab/vetespana-web):
//   node scripts/publicar-altas.mjs
// Variables: DATABASE_URL_ESCRITURA
import pg from 'pg'

// Idéntica a toSlug()/ciudadSlug() de la web
const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
const texto = (v) => (v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim())

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_ESCRITURA })
await db.connect()
const { rows: altas } = await db.query(`SELECT * FROM altas WHERE estado = 'aprobada' ORDER BY id`)
const { rows: especialidades } = await db.query('SELECT id, nombre FROM especialidades')
let publicadas = 0

for (const a of altas) {
  const anotar = (nota) => db.query('UPDATE altas SET nota = $2 WHERE id = $1', [a.id, nota])
  const nombre = texto(a.nombre)
  if (!nombre) { await anotar('No publicada: falta el nombre de la clínica.'); continue }

  // La ciudad del formulario puede venir con o sin tildes, o con el nombre largo
  const { rows: [ciudad] } = await db.query(
    'SELECT id, slug FROM ciudades WHERE slug = $1 OR lower(nombre) = lower($2) LIMIT 1',
    [slugify(a.ciudad ?? ''), (a.ciudad ?? '').trim()])
  if (!ciudad) {
    await anotar(`No publicada: la ciudad "${a.ciudad ?? ''}" no está en la tabla ciudades. Corrige el campo ciudad y guarda (sigue aprobada).`)
    continue
  }

  // Slug único: el nombre; si ya existe, con la ciudad; si aún choca, -2, -3…
  const base = slugify(nombre) || 'clinica'
  const libre = async (s) => (await db.query('SELECT 1 FROM clinicas WHERE slug = $1', [s])).rowCount === 0
  let slug = base
  if (!(await libre(slug))) {
    slug = `${base}-${ciudad.slug}`
    for (let n = 2; !(await libre(slug)); n++) slug = `${base}-${ciudad.slug}-${n}`
  }

  try {
    await db.query('BEGIN')
    const { rows: [clinica] } = await db.query(
      `INSERT INTO clinicas (nombre, slug, ciudad_id, direccion, telefono, whatsapp, email, web, redes_sociales,
                             horario, descripcion, urgencias_24h)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [nombre, slug, ciudad.id, texto(a.direccion), texto(a.telefono), texto(a.whatsapp), texto(a.email),
       texto(a.web), texto(a.redes_sociales), texto(a.horario), texto(a.descripcion), a.urgencias_24h === true])
    const nombresEsp = (a.especialidades ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    for (const e of especialidades.filter((e) => nombresEsp.includes(e.nombre.toLowerCase()))) {
      await db.query('INSERT INTO clinica_especialidades (clinica_id, especialidad_id) VALUES ($1, $2)', [clinica.id, e.id])
    }
    if (a.foto_archivo) {
      await db.query(
        `INSERT INTO fotos (clinica_id, tipo, orden, archivo, origen) VALUES ($1, 'portada', 0, $2, 'subida')`,
        [clinica.id, a.foto_archivo])
    }
    await db.query(`UPDATE altas SET estado = 'publicada', clinica_id = $2, nota = NULL WHERE id = $1`, [a.id, clinica.id])
    await db.query('COMMIT')
    publicadas++
    console.log(`Altas: publicada "${nombre}" → /clinicas/${slug}`)
  } catch (e) {
    await db.query('ROLLBACK')
    await anotar(`No publicada: error al guardarla (${e.message}).`)
  }
}
await db.end()
console.log(`Altas: ${publicadas} publicadas de ${altas.length} aprobadas`)
