import { getAllClinics } from '@/utilidades/base-de-datos'
import { aIndice } from '@/utilidades/indice'

// Se genera en el build como archivo estático: /datos/clinicas.json
// (índice compacto para los filtros, el scroll infinito y "Cerca de mí").
export const dynamic = 'force-static'

export async function GET() {
  return Response.json(aIndice(await getAllClinics()))
}
