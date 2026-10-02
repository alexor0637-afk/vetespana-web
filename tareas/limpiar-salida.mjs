// Quita de la web generada (out/) los archivos .txt con los que Next navega sin
// recargar la página: Next 16 genera ~9 por página y con ~2.800 páginas pasaríamos
// del límite de 20.000 archivos del plan gratuito de Cloudflare. Los enlaces
// internos son <a> normales (componentes/estructura/Enlace.tsx), así que no se usan.
//
//   node tareas/limpiar-salida.mjs [carpeta]   (por defecto out/)
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.argv[2] ?? 'out'
let borrados = 0

;(function recorrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      recorrer(p)
      if (fs.readdirSync(p).length === 0) fs.rmdirSync(p) // carpeta que solo tenía fragmentos
      continue
    }
    if (!e.name.endsWith('.txt')) continue
    // Fragmentos de navegación (__next.*.txt) y la carga RSC de cada página (x.txt junto a x.html).
    // robots.txt no tiene robots.html al lado, así que no se toca.
    const esFragmento = e.name.startsWith('__next.')
    const esCargaDePagina = fs.existsSync(p.slice(0, -'.txt'.length) + '.html')
    if (esFragmento || esCargaDePagina) {
      fs.unlinkSync(p)
      borrados++
    }
  }
})(OUT)

console.log(`Limpieza: ${borrados} archivos de navegación de Next eliminados`)
