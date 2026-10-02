import type { Metadata } from 'next'
import Link from '@/componentes/estructura/Enlace'
import { BotonCookies } from '@/componentes/estructura/AvisoCookies'
import { metadatosPagina } from '@/utilidades/seo'
import { GA_ID, TITULAR, LEGAL_ACTUALIZADO } from '@/utilidades/legal'

// Política de cookies (Guía de cookies de la AEPD). Tiene que coincidir con lo que carga
// componentes/estructura/AvisoCookies.tsx: si se añade una herramienta, añadir aquí sus cookies.
export const metadata: Metadata = metadatosPagina({
  title: 'Política de cookies',
  description: 'Qué cookies usa VetEspaña, para qué sirven y cómo aceptarlas, rechazarlas o cambiar tu elección.',
  ruta: '/cookies',
  indexar: false,
})

const COOKIES = [
  {
    nombre: 'vetespana-cookies',
    proveedor: 'VetEspaña',
    uso: 'Recordar si has aceptado o rechazado las cookies (se guarda en el almacenamiento del navegador).',
    duracion: '1 año',
    tipo: 'Técnica: no necesita consentimiento',
  },
  {
    nombre: '_ga',
    proveedor: 'Google Analytics',
    uso: 'Distinguir a los visitantes para contar las visitas.',
    duracion: '2 años',
    tipo: 'Analítica: solo si la aceptas',
  },
  {
    nombre: `_ga_${GA_ID.replace('G-', '')}`,
    proveedor: 'Google Analytics',
    uso: 'Mantener el estado de la visita (sesión).',
    duracion: '2 años',
    tipo: 'Analítica: solo si la aceptas',
  },
  // Microsoft Clarity solo se carga (con permiso) si se configura su ID al generar la web
  ...(process.env.NEXT_PUBLIC_CLARITY_ID
    ? [
        { nombre: '_clck', proveedor: 'Microsoft Clarity', uso: 'Reconocer al visitante entre visitas.', duracion: '1 año', tipo: 'Analítica: solo si la aceptas' },
        { nombre: '_clsk', proveedor: 'Microsoft Clarity', uso: 'Agrupar las páginas vistas en una misma visita.', duracion: '1 día', tipo: 'Analítica: solo si la aceptas' },
      ]
    : []),
]

export default function CookiesPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-700 leading-relaxed space-y-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:pt-4 [&_a]:text-teal-700 [&_a]:underline">
      <h1 className="text-3xl font-bold text-gray-900">Política de cookies</h1>

      <h2>Qué son las cookies</h2>
      <p>
        Las cookies son pequeños archivos que una web guarda en tu navegador para recordar información entre páginas
        o entre visitas. Algunas son necesarias para que la web funcione; otras, como las de estadísticas, solo se
        usan si das tu permiso.
      </p>

      <h2>Qué cookies usamos</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-gray-200">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="p-2">Nombre</th>
              <th className="p-2">Proveedor</th>
              <th className="p-2">Para qué sirve</th>
              <th className="p-2">Duración</th>
              <th className="p-2">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES.map((c) => (
              <tr key={c.nombre} className="border-t border-gray-200 align-top">
                <td className="p-2 font-mono">{c.nombre}</td>
                <td className="p-2">{c.proveedor}</td>
                <td className="p-2">{c.uso}</td>
                <td className="p-2 whitespace-nowrap">{c.duracion}</td>
                <td className="p-2">{c.tipo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Las cookies analíticas las gestiona Google Ireland Limited, que puede tratar datos en Estados Unidos al amparo
        del Marco de Privacidad de Datos UE-EE. UU. Más información en la{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">política de privacidad de Google</a>.
      </p>

      <h2>Cómo aceptar, rechazar o cambiar tu elección</h2>
      <p>
        La primera vez que entras te preguntamos si aceptas las cookies analíticas. Mientras no las aceptes, no se
        cargan. Puedes cambiar tu elección cuando quieras con el botón «Configurar cookies» del pie de la página o
        aquí mismo:
      </p>
      <p>
        <BotonCookies className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold" />
      </p>
      <p>
        Si las rechazas después de haberlas aceptado, borramos las cookies de Google Analytics de tu navegador. También
        puedes borrar o bloquear las cookies desde la configuración de tu navegador.
      </p>

      <h2>Más información</h2>
      <p>
        Cómo tratamos los datos personales se explica en la <Link href="/privacidad">política de privacidad</Link>.
        Para cualquier duda, escribe a <a href={`mailto:${TITULAR.email}`}>{TITULAR.email}</a>.
      </p>

      <p className="text-gray-500 pt-4">Última actualización: {LEGAL_ACTUALIZADO}.</p>
    </article>
  )
}
