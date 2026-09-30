// Escribe src/data/ciudades-bd.json con las ciudades de la base y cuántas clínicas
// tiene cada una: [slug, nombre, comunidad, nº de clínicas]. Lo lanza
// publicar-contenedor.sh justo antes de `next build` (en el repo el archivo va vacío).
// Con él, la web añade sola las ciudades nuevas de la base (types/clinic.ts) y los
// buscadores no ofrecen ciudades sin clínicas.
//
// Uso: DATABASE_URL=postgresql://… node scripts/ciudades-bd.mjs   (basta el rol de lectura)
import fs from 'node:fs'
import pg from 'pg'

const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()
try {
  const { rows } = await db.query(`
    SELECT ci.slug, ci.nombre, co.nombre AS comunidad, count(cl.id)::int AS clinicas
      FROM ciudades ci
      JOIN comunidades co ON co.id = ci.comunidad_id
      LEFT JOIN clinicas cl ON cl.ciudad_id = ci.id AND NOT cl.oculta
     GROUP BY ci.id, co.nombre
     ORDER BY ci.slug`)
  const ciudades = rows.map((r) => [r.slug, r.nombre, r.comunidad, r.clinicas])
  fs.writeFileSync(new URL('../src/data/ciudades-bd.json', import.meta.url), JSON.stringify({ ciudades }) + '\n')
  console.log(`ciudades-bd.json: ${ciudades.length} ciudades, ${ciudades.filter((c) => c[3] > 0).length} con clínicas`)
} finally {
  await db.end()
}
