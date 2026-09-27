// Control de calidad de la web generada (out/) ANTES de publicarla. Si algo no
// cuadra, sale con error y la publicación se cancela: es mejor dejar la versión
// anterior en línea que publicar una web vacía o rota.
//
//   node scripts/comprobar-salida.mjs [carpeta]   (por defecto out/)
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.argv[2] ?? 'out'
const MIN_CLINICAS = 1000              // por debajo, algo ha ido mal al leer la base
const MAX_ARCHIVOS = 20000             // límite del plan gratuito de Cloudflare
const MAX_BYTES = 25 * 1024 * 1024     // tamaño máximo por archivo en Cloudflare

const errores = []
const existe = (f) => fs.existsSync(path.join(OUT, f))

for (const f of ['index.html', '404.html', 'sitemap.xml', 'robots.txt', 'datos/clinicas.json', 'clinicas.html', 'cerca-de-mi.html']) {
  if (!existe(f)) errores.push(`falta ${f}`)
}

let archivos = 0, grandes = []
;(function recorrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) recorrer(p)
    else {
      archivos++
      if (fs.statSync(p).size > MAX_BYTES) grandes.push(path.relative(OUT, p))
    }
  }
})(OUT)
if (archivos > MAX_ARCHIVOS) errores.push(`${archivos} archivos: pasa del límite de ${MAX_ARCHIVOS} de Cloudflare`)
if (grandes.length) errores.push(`archivos de más de 25 MiB: ${grandes.join(', ')}`)

let fichas = 0, indice = 0, urls = 0
if (existe('clinicas')) fichas = fs.readdirSync(path.join(OUT, 'clinicas')).filter((f) => f.endsWith('.html')).length
if (existe('datos/clinicas.json')) indice = JSON.parse(fs.readFileSync(path.join(OUT, 'datos/clinicas.json'), 'utf8')).length
if (existe('sitemap.xml')) urls = (fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8').match(/<loc>/g) ?? []).length
if (fichas < MIN_CLINICAS) errores.push(`solo ${fichas} fichas de clínica (mínimo ${MIN_CLINICAS})`)
if (indice !== fichas) errores.push(`el índice tiene ${indice} clínicas y hay ${fichas} fichas`)
if (urls < fichas) errores.push(`el sitemap tiene ${urls} URLs, menos que fichas (${fichas})`)

console.log(`Comprobación: ${fichas} fichas · índice ${indice} · sitemap ${urls} URLs · ${archivos} archivos`)
if (errores.length) {
  console.error(`NO SE PUBLICA:\n  - ${errores.join('\n  - ')}`)
  process.exit(1)
}
console.log('Comprobación: OK')
