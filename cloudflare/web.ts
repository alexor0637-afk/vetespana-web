// Web (Worker "vetespana-web"): son archivos estáticos (out/) que Cloudflare sirve solo.
// Este código se ejecuta ÚNICAMENTE en /clinicas (assets.run_worker_first en wrangler.jsonc)
// para redirigir con un 301 de verdad las URLs antiguas de la etapa de Vercel, que Google y
// otras webs aún pueden tener:
//   /clinicas?ciudad=Madrid     → /veterinarios/madrid
//   /clinicas?comunidad=Aragón  → /comunidades/aragon
// Con otros filtros (especialidad, urgencias…) no se redirige: es el listado filtrado.
import { ciudadSlug } from '../src/utilidades/slug'

interface Env {
  ASSETS: { fetch(peticion: Request): Promise<Response> }
}

// Parámetros de campañas y anuncios: no cuentan como filtros
const IGNORAR = /^(utm_\w+|gclid|fbclid|msclkid)$/

const web = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/clinicas' && (request.method === 'GET' || request.method === 'HEAD')) {
      const claves = [...url.searchParams.keys()].filter((k) => !IGNORAR.test(k))
      const soloLugar = claves.length > 0 && claves.every((k) => k === 'ciudad' || k === 'comunidad')
      const ciudad = url.searchParams.get('ciudad')?.trim()
      const comunidad = url.searchParams.get('comunidad')?.trim()
      const destino = !soloLugar ? null
        : ciudad ? `/veterinarios/${ciudadSlug(ciudad)}`
        : comunidad ? `/comunidades/${ciudadSlug(comunidad)}`
        : null
      if (destino && !destino.endsWith('/')) {
        // Solo si esa página existe; si no, se sirve el listado (que ya se apaña en el navegador)
        const existe = await env.ASSETS.fetch(new Request(new URL(destino, url), { method: 'HEAD' }))
        if (existe.ok) return Response.redirect(new URL(destino, url).toString(), 301)
      }
    }
    return env.ASSETS.fetch(request)
  },
}

export default web
