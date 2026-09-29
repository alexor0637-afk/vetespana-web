import type { Metadata } from 'next'
import Link from '@/components/Enlace'
import { metadatosPagina } from '@/lib/seo'
import { TITULAR, LEGAL_ACTUALIZADO } from '@/lib/legal'

// Política de privacidad (RGPD arts. 13 y 14). Describe SOLO lo que la web hace de verdad:
// si cambia un formulario, un proveedor o lo que se guarda, hay que actualizarla.
export const metadata: Metadata = metadatosPagina({
  title: 'Política de privacidad',
  description: 'Qué datos personales trata VetEspaña, para qué, durante cuánto tiempo y cómo ejercer tus derechos.',
  ruta: '/privacidad',
  indexar: false,
})

export default function PrivacidadPage() {
  const correo = <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-700 leading-relaxed space-y-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:pt-4 [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:pt-2 [&_a]:text-teal-700 [&_a]:underline">
      <h1 className="text-3xl font-bold text-gray-900">Política de privacidad</h1>

      <h2>Quién es el responsable</h2>
      <p>
        {TITULAR.nombre} (NIF {TITULAR.nif}), con domicilio en {TITULAR.domicilio}, titular de VetEspaña. Para
        cualquier cuestión sobre tus datos puedes escribir a {correo}.
      </p>

      <h2>Qué datos tratamos y para qué</h2>

      <h3>1. Si escribes una reseña</h3>
      <p>
        Tratamos el nombre que indiques (se publica junto a tu opinión), la puntuación y el comentario, para moderar
        tu reseña y publicarla en la ficha de la clínica. Base legal: tu consentimiento, que das al enviarla.
        La conservamos mientras esté publicada; puedes pedirnos que la retiremos cuando quieras.
      </p>

      <h3>2. Si das de alta una clínica o pides cambios en su ficha</h3>
      <p>
        Tratamos los datos de la clínica que nos envías (se publican en su ficha) y tus datos de contacto: nombre,
        cargo, correo, teléfono y mensaje. Estos últimos <strong>no se publican</strong>: solo los usamos para
        comprobar la solicitud y escribirte si hace falta. Base legal: atender tu solicitud (art. 6.1.b del RGPD).
        Los conservamos mientras la ficha esté publicada y, después, el tiempo necesario para atender posibles
        reclamaciones.
      </p>

      <h3>3. Datos de las clínicas del directorio</h3>
      <p>
        Publicamos datos profesionales de las clínicas: nombre comercial, dirección, teléfono, correo, web, redes
        sociales, horario, especialidades y fotos. Los obtenemos de fuentes de acceso público (Google Maps y las webs
        de las propias clínicas) o nos los facilitan ellas, y los publicamos para que los dueños de mascotas puedan
        encontrar y contactar con una clínica. Base legal: interés legítimo (art. 6.1.f del RGPD), el de los usuarios
        en encontrar veterinario y el de las clínicas en ser encontradas.
      </p>
      <p>
        Si eres responsable de una clínica, o el profesional cuyos datos aparecen, puedes pedir que los corrijamos o
        los retiremos, u oponerte a su publicación, escribiendo a {correo}. También podemos escribir al correo
        profesional de las clínicas para invitarlas a revisar o completar su ficha; si no quieres recibir estos
        correos, dínoslo y no volveremos a escribirte.
      </p>

      <h3>4. Si nos escribes</h3>
      <p>
        Usamos tu correo y lo que nos cuentes solo para responderte. Lo conservamos el tiempo necesario para atender
        tu consulta.
      </p>

      <h3>5. Protección frente al spam</h3>
      <p>
        Cuando envías un formulario guardamos durante un tiempo limitado un resumen (hash) de tu dirección IP, no la
        dirección en sí, y el número de envíos por hora, para limitar los envíos masivos. Base legal: interés
        legítimo en la seguridad del servicio.
      </p>

      <h3>6. Estadísticas de visitas</h3>
      <p>
        Solo si aceptas las cookies analíticas, Google Analytics recoge las páginas que visitas, el tipo de
        dispositivo y navegador, tu ubicación aproximada y un identificador de la cookie, para contar las visitas.
        Base legal: tu consentimiento, que puedes retirar en cualquier momento en «Configurar cookies», al pie de la
        página. Más detalles en la <Link href="/cookies">política de cookies</Link>.
      </p>

      <h2>A quién comunicamos los datos</h2>
      <p>
        No vendemos ni cedemos tus datos a nadie, salvo obligación legal. Los tratan por nuestra cuenta, como
        encargados del tratamiento, estos proveedores:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Cloudflare, Inc.: alojamiento de la web, recepción de los formularios y del correo.</li>
        <li>Google Ireland Limited: estadísticas de visitas (solo si las aceptas).</li>
        <li>Brevo (Francia): envío de correos a las clínicas.</li>
      </ul>
      <p>
        La base de datos del directorio está en un servidor propio situado en España. Cloudflare y Google pueden
        tratar datos en Estados Unidos; lo hacen al amparo del Marco de Privacidad de Datos UE-EE. UU. y de las
        cláusulas contractuales tipo de la Comisión Europea.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes pedir acceder a tus datos, rectificarlos, suprimirlos, oponerte a su tratamiento, limitarlo o
        llevártelos a otro servicio (portabilidad), y retirar tu consentimiento cuando quieras, sin que afecte a lo
        tratado antes. Escríbenos a {correo}; si hace falta, te pediremos que acredites tu identidad.
      </p>
      <p>
        Si crees que no hemos atendido bien tu petición, puedes reclamar ante la Agencia Española de Protección de
        Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).
      </p>

      <h2>Otras cuestiones</h2>
      <p>
        No tomamos decisiones automatizadas ni elaboramos perfiles con tus datos. Para escribir una reseña debes tener
        al menos 14 años.
      </p>

      <p className="text-gray-500 pt-4">Última actualización: {LEGAL_ACTUALIZADO}.</p>
    </article>
  )
}
