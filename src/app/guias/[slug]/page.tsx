import type { Metadata } from 'next'
import Link from '@/components/Enlace'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import React from 'react'
import { GUIAS, getGuia } from '@/data/guias'
import GuiaHero from '@/components/GuiaHero'
import { clinicasMasDe } from '@/lib/datos'

const BASE = 'https://www.vetespana.es'

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guia = getGuia(slug)
  if (!guia) return {}
  return {
    title: guia.metaTitulo,
    description: guia.descripcion,
    alternates: { canonical: `${BASE}/guias/${guia.slug}` },
    openGraph: {
      type: 'article',
      title: guia.metaTitulo,
      description: guia.descripcion,
      url: `${BASE}/guias/${guia.slug}`,
    },
  }
}

// Convierte enlaces markdown [texto](/ruta) en <Link> internos dentro de un párrafo.
function renderParrafo(texto: string): React.ReactNode[] {
  const partes: React.ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(texto)) !== null) {
    if (m.index > last) partes.push(texto.slice(last, m.index))
    partes.push(
      <Link key={i++} href={m[2]} className="text-teal-700 font-medium hover:underline">
        {m[1]}
      </Link>
    )
    last = m.index + m[0].length
  }
  if (last < texto.length) partes.push(texto.slice(last))
  return partes
}

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guia = getGuia(slug)
  if (!guia) notFound()
  const masDe = await clinicasMasDe()

  const otras = GUIAS.filter((g) => g.slug !== guia.slug).slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: guia.titulo,
        description: guia.descripcion,
        datePublished: guia.actualizado,
        dateModified: guia.actualizado,
        author: { '@type': 'Organization', name: 'VetEspaña', url: BASE },
        publisher: { '@type': 'Organization', name: 'VetEspaña', url: BASE },
        mainEntityOfPage: `${BASE}/guias/${guia.slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Guías', item: `${BASE}/guias` },
          { '@type': 'ListItem', position: 3, name: guia.titulo, item: `${BASE}/guias/${guia.slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: guia.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-teal-600">Inicio</Link> <span className="mx-1">/</span>{' '}
        <Link href="/guias" className="hover:text-teal-600">Guías</Link> <span className="mx-1">/</span>{' '}
        <span className="text-gray-700">{guia.titulo}</span>
      </nav>

      <GuiaHero
        img={guia.heroImg}
        alt={guia.heroAlt}
        emoji={guia.emoji}
        titulo={guia.titulo}
        meta={`Actualizado en ${guia.actualizadoTexto} · ${guia.lectura} de lectura`}
      />
      <p className="text-lg text-gray-700 mb-8 leading-relaxed">{guia.resumen}</p>

      {guia.secciones.map((sec, i) => (
        <React.Fragment key={i}>
          <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{sec.h}</h2>
            {sec.parrafos.map((p, j) => (
              <p key={j} className="text-gray-700 leading-relaxed mb-3">
                {renderParrafo(p)}
              </p>
            ))}
            {sec.lista && (
              <ul className="list-disc pl-5 space-y-2 text-gray-700 mt-2">
                {sec.lista.map((li, k) => (
                  <li key={k}>{li}</li>
                ))}
              </ul>
            )}
          </section>
          {i === guia.inlineAfter && (
            <figure className="my-9">
              <Image
                src={guia.inlineImg}
                alt={guia.inlineAlt}
                width={1100}
                height={620}
                sizes="(max-width: 768px) 100vw, 768px"
                className="rounded-2xl w-full h-auto"
              />
              <figcaption className="text-xs text-gray-400 mt-2 text-center">{guia.inlineCaption}</figcaption>
            </figure>
          )}
        </React.Fragment>
      ))}

      {/* CTA al directorio */}
      <div className="my-10 bg-teal-50/60 rounded-2xl border border-teal-100 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Encuentra tu veterinario en VetEspaña</h2>
        <p className="text-gray-600 mb-4">
          Más de {masDe} clínicas en toda España, con horarios, especialidades y urgencias 24h.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/clinicas" className="inline-block bg-teal-700 text-white font-semibold px-6 py-3 rounded-full hover:bg-teal-800 transition-colors">
            Buscar clínicas
          </Link>
          <Link href="/cerca-de-mi" className="inline-block bg-white text-teal-700 font-semibold px-6 py-3 rounded-full border border-teal-200 hover:bg-teal-50 transition-colors">
            Cerca de mí
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {guia.faq.map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{f.q}</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Otras guías */}
      <section className="border-t border-gray-100 pt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Otras guías</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {otras.map((g) => (
            <Link
              key={g.slug}
              href={`/guias/${g.slug}`}
              className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-teal-200 transition-all"
            >
              <div className="text-2xl mb-2">{g.emoji}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{g.titulo}</h3>
            </Link>
          ))}
        </div>
      </section>
    </article>
  )
}
