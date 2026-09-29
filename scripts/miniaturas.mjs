// Miniaturas de las fotos para las tarjetas de los listados (720 px de ancho, WebP).
// La foto original pesa de media ~370 KB (hasta varios MB) y una página de ciudad con
// 40 tarjetas descargaba 7,5 MB. Se generan UNA vez por foto, junto a las originales
// (en mini/), y se publican con ellas (publicar-contenedor.sh copia /fotos a out/fotos).
// La web usa la miniatura solo si existe (src/lib/datos.ts); si no, la foto original.
//
//   node scripts/miniaturas.mjs [carpeta de fotos]   (por defecto $CARPETA_FOTOS o /fotos)
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const CARPETA = process.argv[2] ?? process.env.CARPETA_FOTOS ?? '/fotos'
const MINI = path.join(CARPETA, 'mini')
const ANCHO = 720 // las tarjetas miden hasta ~360 px de ancho: nítidas en pantallas 2x

fs.mkdirSync(MINI, { recursive: true })

let hechas = 0
let yaEstaban = 0
let fallos = 0
for (const nombre of fs.readdirSync(CARPETA)) {
  if (!/\.(jpe?g|png|webp)$/i.test(nombre)) continue
  const origen = path.join(CARPETA, nombre)
  const destino = path.join(MINI, nombre.replace(/\.[^.]+$/, '.webp'))
  // Ya hecha y la original no ha cambiado desde entonces
  if (fs.existsSync(destino) && fs.statSync(destino).mtimeMs >= fs.statSync(origen).mtimeMs) {
    yaEstaban++
    continue
  }
  const temporal = destino.replace(/\.webp$/, '.tmp.webp')
  try {
    await sharp(origen)
      .rotate() // respeta la orientación de las fotos de móvil
      .resize({ width: ANCHO, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(temporal)
    fs.renameSync(temporal, destino)
    hechas++
  } catch (e) {
    fs.rmSync(temporal, { force: true })
    fallos++
    console.error(`Miniaturas: no se pudo hacer la de ${nombre}: ${e.message}`)
  }
}
console.log(`Miniaturas: ${hechas} nuevas · ${yaEstaban} ya estaban${fallos ? ` · ${fallos} con error (esas tarjetas usan la foto original)` : ''}`)
