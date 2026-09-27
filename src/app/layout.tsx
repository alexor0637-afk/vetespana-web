import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Clarity from '@/components/Clarity'
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
        `Más de ${masDe} clínicas veterinarias en toda España. Fotos, horarios, especialidades, urgencias 24h y reseñas reales. Busca veterinario por ciudad.`,
      url: 'https://www.vetespana.es',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'VetEspaña — Encuentra tu veterinario de confianza en España',
      description:
        `Más de ${masDe} clínicas veterinarias en toda España. Fotos, horarios, especialidades y urgencias 24h. Busca veterinario por ciudad.`,
    },
    alternates: {
      canonical: 'https://www.vetespana.es',
    },
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-P4QGVKD4BN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-P4QGVKD4BN');
          `}
        </Script>
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Header />
        <main>{children}</main>
        <Footer />
        <Clarity />
      </body>
    </html>
  )
}
