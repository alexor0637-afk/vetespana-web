import { ImageResponse } from 'next/og'
import { clinicasMasDe } from '@/lib/datos'

// Imagen por defecto al compartir el sitio en redes (WhatsApp, Facebook, X…).
// Las fichas de clínica definen la suya propia (la foto de la clínica) y la sobrescriben.
export const alt = 'VetEspaña — Encuentra tu veterinario de confianza en España'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const masDe = await clinicasMasDe()
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '0 80px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* Huella simple compuesta con círculos (robusto, sin depender de fuentes de emoji) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 22, height: 30, borderRadius: 999, background: 'white' }} />
              <div style={{ width: 22, height: 34, borderRadius: 999, background: 'white', marginTop: -8 }} />
              <div style={{ width: 22, height: 34, borderRadius: 999, background: 'white', marginTop: -8 }} />
              <div style={{ width: 22, height: 30, borderRadius: 999, background: 'white' }} />
            </div>
            <div style={{ width: 70, height: 50, borderRadius: 999, background: 'white' }} />
          </div>
          <div style={{ fontSize: 100, fontWeight: 800, letterSpacing: -2 }}>VetEspaña</div>
        </div>

        <div style={{ fontSize: 42, marginTop: 28, color: '#ccfbf1' }}>
          Encuentra tu veterinario de confianza en España
        </div>

        <div
          style={{
            fontSize: 30,
            marginTop: 40,
            background: 'rgba(255,255,255,0.15)',
            padding: '14px 34px',
            borderRadius: 999,
          }}
        >
          +{masDe} clínicas · fotos, horarios, especialidades y urgencias 24h
        </div>
      </div>
    ),
    { ...size }
  )
}
