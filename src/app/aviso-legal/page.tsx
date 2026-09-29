import type { Metadata } from 'next'
import Link from '@/components/Enlace'
import { metadatosPagina } from '@/lib/seo'
import { TITULAR, LEGAL_ACTUALIZADO } from '@/lib/legal'

// Aviso legal (LSSI art. 10). Sin indexar en Google: es obligatorio publicarlo, pero no
// hace falta que el nombre y el NIF del titular salgan en los buscadores.
export const metadata: Metadata = metadatosPagina({
  title: 'Aviso legal',
  description: 'Datos del titular de VetEspaña, condiciones de uso del directorio y cómo denunciar contenidos.',
  ruta: '/aviso-legal',
  indexar: false,
})

export default function AvisoLegalPage() {
  const correo = <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-700 leading-relaxed space-y-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:pt-4 [&_a]:text-teal-700 [&_a]:underline">
      <h1 className="text-3xl font-bold text-gray-900">Aviso legal</h1>

      <h2>Titular de la web</h2>
      <p>
        En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio
        Electrónico (LSSI), estos son los datos del titular de www.vetespana.es:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Titular: {TITULAR.nombre}</li>
        <li>NIF: {TITULAR.nif}</li>
        <li>Correo electrónico: {correo}</li>
      </ul>

      <h2>Qué es VetEspaña</h2>
      <p>
        VetEspaña es un directorio gratuito e informativo de clínicas veterinarias en España. VetEspaña no presta
        servicios veterinarios ni intermedia en ellos, y no tiene relación comercial con las clínicas que aparecen
        salvo que se indique expresamente.
      </p>

      <h2>Información de las clínicas</h2>
      <p>
        Los datos de las clínicas proceden de fuentes de acceso público (como Google Maps y las webs de las propias
        clínicas) y de lo que nos envían las clínicas. Hacemos lo posible por mantenerlos al día, pero pueden contener
        errores o estar desactualizados: confirma siempre con la clínica antes de acudir, sobre todo en caso de
        urgencia.
      </p>
      <p>
        Si la ficha de tu clínica tiene datos incorrectos, puedes pedir que los corrijamos con el botón «¿Es tu
        clínica?» de la propia ficha, o pedir que la retiremos escribiendo a {correo}.
      </p>

      <h2>Opiniones de los usuarios</h2>
      <p>
        Las reseñas reflejan la opinión de quien las escribe, no la de VetEspaña. Las revisamos antes de publicarlas
        para filtrar el spam y el contenido ofensivo, pero no podemos comprobar que su autor haya sido cliente de la
        clínica. No publicamos reseñas con insultos, datos personales de otras personas, publicidad ni contenido
        ilegal.
      </p>

      <h2>Cómo denunciar un contenido</h2>
      <p>
        Si ves en VetEspaña un contenido que crees ilegal o que vulnera tus derechos (una reseña, una foto o un dato),
        escríbenos a {correo} indicando la dirección de la página, qué contenido es y por qué debería retirarse. Lo
        revisaremos lo antes posible y te responderemos. Este correo es también nuestro punto de contacto a efectos
        del Reglamento (UE) 2022/2065 de Servicios Digitales.
      </p>

      <h2>Fotos</h2>
      <p>
        Las fotos de las clínicas proceden de Google Maps (se indica en cada foto) o las aportan las propias clínicas.
        Si eres titular de los derechos de alguna imagen y quieres que la retiremos, escríbenos.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        Los textos, el diseño y la marca VetEspaña pertenecen a su titular. Los nombres y logotipos de las clínicas
        pertenecen a sus respectivos titulares. No está permitido copiar de forma masiva el contenido del directorio
        sin autorización.
      </p>

      <h2>Enlaces a otras webs</h2>
      <p>
        Las fichas enlazan a las webs y redes sociales de las clínicas y a otros servicios (como Google Maps).
        VetEspaña no controla su contenido y no se hace responsable de él.
      </p>

      <h2>Privacidad y cookies</h2>
      <p>
        Cómo tratamos los datos personales se explica en la <Link href="/privacidad">política de privacidad</Link>, y
        qué cookies usamos, en la <Link href="/cookies">política de cookies</Link>.
      </p>

      <h2>Legislación aplicable</h2>
      <p>
        Este aviso legal se rige por la legislación española. Si eres consumidor, podrás acudir a los juzgados de tu
        domicilio.
      </p>

      <p className="text-gray-500 pt-4">Última actualización: {LEGAL_ACTUALIZADO}.</p>
    </article>
  )
}
