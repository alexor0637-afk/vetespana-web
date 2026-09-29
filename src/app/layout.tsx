import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AvisoCookies from '@/components/Cookies'
import { clinicasMasDe } from '@/lib/datos'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const masDe = await clinicasMasDe()
  return {
    metadataBase: new URL('https://www.vetespana.es'),
    title: {
      default: 'VetEspaña — Encuentra tu veterinario de confianza en España',
      template: '%s | VetEspaña',
    },
    description:
      `Encuentra tu veterinario de confianza: más de ${masDe} clínicas veterinarias en toda España, con fotos, horarios, especialidades y urgencias 24h. Busca por ciudad.`,
    keywords: [
      'veterinaria',
      'clínica veterinaria',
      'veterinario España',
      'urgencias veterinarias 24h',
      'veterinario cerca de mí',
      'clínica veterinaria Madrid',
      'clínica veterinaria Barcelona',
    ],
    openGraph: {
      type: 'website',
      locale: 'es_ES',
      siteName: 'VetEspaña',
      title: 'VetEspaña — Encuentra tu veterinario de confianza en España',
      description:
        `Más de ${masDe} clínicas veterinarias en toda España. Teléfono, horarios, especialidades y urgencias 24h. Busca veterinario por ciudad.`,
      url: 'https://www.vetespana.es',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'VetEspaña — Encuentra tu veterinario de confianza en España',
      description:
        `Más de ${masDe} clínicas veterinarias en toda España. Fotos, horarios, especialidades y urgencias 24h. Busca veterinario por ciudad.`,
    },
    // Sin canonical aquí: la pone cada página (la portada, en app/page.tsx). Si estuviera en
    // el layout, cualquier página sin la suya (p. ej. la 404) apuntaría a la portada.
    verification: {
      google: '6nCvZZXDFshsAsAl-yHK3T2iDNj70NB7OubJ06VMR-Q',
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {/* Para quien navega con teclado: salta la cabecera (solo se ve al recibir el foco) */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-teal-800 focus:shadow"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido">{children}</main>
        <Footer />
        {/* Google Analytics (y Clarity) solo se cargan si el visitante acepta las cookies */}
        <AvisoCookies />
      </body>
    </html>
  )
}
