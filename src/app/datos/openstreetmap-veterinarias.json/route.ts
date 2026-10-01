import { getAllClinics } from '@/lib/datos'
import { nombreCiudad } from '@/types/clinic'
import { SITIO } from '@/lib/seo'

// Las fichas cuyos datos salen de OpenStreetMap, tal como se publican en la web. Es una base
// de datos derivada de OSM: su licencia (ODbL) obliga a ofrecerla con la misma licencia y con
// atribución. Se genera en el build como archivo estático: /datos/openstreetmap-veterinarias.json
// (enlazado desde el aviso legal). No lleva emails: los de particulares no se publican.
export const dynamic = 'force-static'

export async function GET() {
  const clinicas = (await getAllClinics()).filter((c) => c.osmId)
  return Response.json({
    licencia: 'Open Database License (ODbL) v1.0 — https://opendatacommons.org/licenses/odbl/1-0/',
    atribucion: '© colaboradores de OpenStreetMap (https://www.openstreetmap.org/copyright). Datos adaptados por VetEspaña (https://www.vetespana.es).',
    descripcion:
      'Clínicas veterinarias de VetEspaña cuyos datos proceden de OpenStreetMap (amenity=veterinary), con el formato de la web: nombre, ciudad, dirección, teléfono, web, horario y coordenadas.',
    clinicas: clinicas.map((c) => ({
      osm: `https://www.openstreetmap.org/${c.osmId}`,
      ficha: `${SITIO}/clinicas/${c.slug}`,
      nombre: c.nombre,
      ciudad: nombreCiudad(c.ciudad),
      direccion: c.direccion || null,
      telefono: c.telefono || null,
      web: c.web ?? null,
      horario: c.horario ?? null,
      urgencias24h: c.urgencias24h,
      lat: c.lat ?? null,
      lng: c.lng ?? null,
    })),
  })
}
