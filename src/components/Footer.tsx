import Link from '@/components/Enlace'
import { PawPrint } from 'lucide-react'
import { COMUNIDADES, CIUDADES_POR_COMUNIDAD, CIUDAD_DISPLAY } from '@/types/clinic'
import { ciudadSlug } from '@/lib/ciudad-slug'
import { BotonCookies } from '@/components/Cookies'

// Lista plana de todas las ciudades válidas (para no enlazar a páginas vacías)
const TODAS_CIUDADES = new Set(Object.values(CIUDADES_POR_COMUNIDAD).flat())

// Ciudades grandes destacadas para enlazar desde el footer (enlaces internos SEO).
// Se filtran contra la lista real para que nunca haya un enlace roto.
const CIUDADES_DESTACADAS = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga',
  'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba',
  'Valladolid', 'Vigo', 'Gijón', 'A Coruña', 'Granada', 'Vitoria',
  'Pamplona', 'Santander', 'San Sebastián', 'Cartagena', 'Tarragona', 'Oviedo',
].filter((c) => TODAS_CIUDADES.has(c))

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <PawPrint size={20} className="fill-teal-400 text-teal-400" />
              VetEspaña
            </Link>
            <p className="text-sm leading-relaxed">
              El directorio de referencia de clínicas veterinarias en España. Encuentra el mejor
              veterinario para tu mascota.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Para dueños de mascotas</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/clinicas" className="hover:text-white transition-colors">Buscar clínicas veterinarias</Link></li>
              <li><Link href="/cerca-de-mi" className="hover:text-white transition-colors">Veterinario cerca de mí</Link></li>
              <li><Link href="/clinicas?urgencias=1" className="hover:text-white transition-colors">Veterinarios urgencias 24h</Link></li>
              <li><Link href="/guias" className="hover:text-white transition-colors">Guías para dueños de mascotas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Para clínicas</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/alta-clinica" className="hover:text-white transition-colors">Añadir mi clínica</Link></li>
            </ul>
          </div>
        </div>

        {/* Veterinarios por ciudad — enlaces internos para SEO local */}
        <div className="border-t border-gray-800 pt-6 mb-6">
          <h4 className="text-white font-semibold mb-3 text-sm">Clínicas veterinarias por ciudad</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {CIUDADES_DESTACADAS.map((ciudad) => (
              <Link
                key={ciudad}
                href={`/veterinarios/${ciudadSlug(ciudad)}`}
                className="hover:text-white transition-colors"
              >
                Veterinarios en {CIUDAD_DISPLAY[ciudad] ?? ciudad}
              </Link>
            ))}
            <Link href="/ciudades" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              Ver todas las ciudades →
            </Link>
          </div>
        </div>

        {/* Por comunidad autónoma */}
        <div className="border-t border-gray-800 pt-6 mb-6">
          <h4 className="text-white font-semibold mb-3 text-sm">Por comunidad autónoma</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {COMUNIDADES.map((comunidad) => (
              <Link
                key={comunidad}
                href={`/comunidades/${ciudadSlug(comunidad)}`}
                className="hover:text-white transition-colors"
              >
                {comunidad}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-sm text-center space-y-3">
          <nav aria-label="Información legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link href="/aviso-legal" className="hover:text-white transition-colors">Aviso legal</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            <BotonCookies className="hover:text-white transition-colors" />
          </nav>
          <p>© {new Date().getFullYear()} VetEspaña · El directorio veterinario de confianza en España</p>
        </div>
      </div>
    </footer>
  )
}
