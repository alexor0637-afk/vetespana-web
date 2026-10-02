import type { AnchorHTMLAttributes } from 'react'

// Enlace interno = <a> normal. La web es estática y cada página es un HTML completo:
// no se publican los archivos .txt con los que Next navega sin recargar (serían
// ~9 archivos por página y pasaríamos del límite de archivos del plan gratuito de
// Cloudflare). Sin ellos, el <Link> de Next pediría archivos inexistentes.
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} />
}
