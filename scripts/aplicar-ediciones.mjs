// Aplica a las clínicas los cambios que el dueño de VetEspaña ha APROBADO en NocoDB
// (tabla ediciones, estado = aprobada) y los deja como «aplicada». Si alguno no se
// puede aplicar (p. ej. una ciudad que no existe), se queda como está y se explica
// en su columna `nota`. Si cambia la dirección, se recalculan las coordenadas.
//
// Se ejecuta cada 10 minutos (contenedor de ~/homelab/vetespana-web):
//   node scripts/aplicar-ediciones.mjs
// Variables: DATABASE_URL_ESCRITURA
import pg from 'pg'
import { coordenadasDe } from './geocodificar.mjs'

// Idéntica a toSlug()/ciudadSlug() de la web
const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
const texto = (v) => (v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim())

// Campo del formulario → columna de clinicas
const COLUMNAS = {
  nombre: 'nombre', direccion: 'direccion', telefono: 'telefono', whatsapp: 'whatsapp', email: 'email',
  web: 'web', redes: 'redes_sociales', horario: 'horario', descripcion: 'descripcion',
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_ESCRITURA })
await db.connect()
const { rows: pendientes } = await db.query(`SELECT * FROM ediciones WHERE estado = 'aprobada' ORDER BY id`)
const { rows: especialidades } = await db.query('SELECT id, nombre FROM especialidades')
let aplicadas = 0

for (const ed of pendientes) {
  const cambios = ed.datos?.cambios ?? {}
  const anotar = (nota) => db.query('UPDATE ediciones SET nota = $2 WHERE id = $1', [ed.id, nota])
  try {
    const { rows: [clinica] } = await db.query('SELECT id, nombre, direccion, ciudad_id FROM clinicas WHERE id = $1', [ed.clinica_id])
    if (!clinica) throw new Error('la clínica ya no existe')

    const valores = []
    const sets = []
    const poner = (columna, valor) => {
      valores.push(valor)
      sets.push(`${columna} = $${valores.length + 1}`)
    }
    for (const [campo, columna] of Object.entries(COLUMNAS)) {
      if (campo in cambios) {
        if (campo === 'nombre' && !texto(cambios.nombre)) continue // el nombre no se puede dejar vacío
        poner(columna, texto(cambios[campo]))
      }
    }
    if (typeof cambios.urgencias24h === 'boolean') poner('urgencias_24h', cambios.urgencias24h)

    let ciudadId = clinica.ciudad_id
    const ciudadNueva = texto(cambios.ciudad) ?? texto(cambios.ciudadOtra)
    if (ciudadNueva) {
      const { rows: [ciudad] } = await db.query(
        'SELECT id FROM ciudades WHERE slug = $1 OR lower(nombre) = lower($2) LIMIT 1', [slugify(ciudadNueva), ciudadNueva])
      if (!ciudad) throw new Error(`la ciudad "${ciudadNueva}" no está en la tabla ciudades. Créala en NocoDB (tabla ciudades: nombre, slug y comunidad; la web la añade sola) o pídeselo a Claude, y vuelve a guardar la fila, que sigue aprobada.`)
      ciudadId = ciudad.id
      poner('ciudad_id', ciudadId)
    }
    if (ed.verificar) poner('verificada', true)
    // Si nos dan o confirman su email (o la verificamos), ya se puede publicar aunque sea de Gmail…
    if ('email' in cambios || ed.verificar) poner('email_confirmado', true)
    // «Retirar la ficha» (la clínica ha cerrado…): se oculta de la web, sin borrar nada.
    // Para volver a mostrarla, desmarca «oculta» en la clínica.
    if (cambios.retirar === true) poner('oculta', true)

    // Nueva dirección o ciudad: nuevas coordenadas (antes de abrir la transacción)
    let avisoCoordenadas = null
    const direccion = 'direccion' in cambios ? texto(cambios.direccion) : clinica.direccion
    if ('direccion' in cambios || ciudadNueva) {
      const punto = await coordenadasDe(db, direccion, ciudadId)
      if (punto) {
        poner('lat', punto.lat)
        poner('lng', punto.lng)
      } else {
        avisoCoordenadas = 'Aplicada, pero no se han encontrado las coordenadas de la dirección nueva: corrige lat y lng a mano si hace falta.'
      }
    }

    await db.query('BEGIN')
    if (sets.length) await db.query(`UPDATE clinicas SET ${sets.join(', ')} WHERE id = $1`, [ed.clinica_id, ...valores])
    if (Array.isArray(cambios.especialidades)) {
      await db.query('DELETE FROM clinica_especialidades WHERE clinica_id = $1', [ed.clinica_id])
      for (const e of especialidades.filter((e) => cambios.especialidades.includes(e.nombre))) {
        await db.query('INSERT INTO clinica_especialidades (clinica_id, especialidad_id) VALUES ($1, $2)', [ed.clinica_id, e.id])
      }
    }
    if (ed.foto_archivo) {
      // La foto nueva pasa a ser la portada (solo puede haber una por clínica)
      const r = await db.query(
        `UPDATE fotos SET archivo = $2, origen = 'subida', ancho = NULL, alto = NULL, bytes = NULL
          WHERE clinica_id = $1 AND tipo = 'portada'`, [ed.clinica_id, ed.foto_archivo])
      if (!r.rowCount) {
        await db.query(`INSERT INTO fotos (clinica_id, tipo, orden, archivo, origen) VALUES ($1, 'portada', 0, $2, 'subida')`,
          [ed.clinica_id, ed.foto_archivo])
      }
    }
    await db.query(`UPDATE ediciones SET estado = 'aplicada', nota = $2 WHERE id = $1`, [ed.id, avisoCoordenadas])
    await db.query('COMMIT')
    aplicadas++
    console.log(`Ediciones: aplicada la ${ed.id} a "${clinica.nombre}"`)
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {})
    await anotar(`No aplicada: ${e.message}`)
    console.error(`Ediciones: la ${ed.id} no se ha podido aplicar: ${e.message}`)
  }
}
await db.end()
if (pendientes.length) console.log(`Ediciones: ${aplicadas} aplicadas de ${pendientes.length} aprobadas`)
