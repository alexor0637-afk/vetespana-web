import { ImageResponse } from 'next/og'

// Icono para iOS (al guardar la web en la pantalla de inicio del iPhone).
// Reemplaza el triángulo por defecto de Next por la huella de VetEspaña.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
// Web estática: se genera una vez en el build como PNG
export const dynamic = 'force-static'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d9488',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 24, height: 32, borderRadius: 999, background: 'white' }} />
            <div style={{ width: 24, height: 36, borderRadius: 999, background: 'white', marginTop: -10 }} />
            <div style={{ width: 24, height: 36, borderRadius: 999, background: 'white', marginTop: -10 }} />
            <div style={{ width: 24, height: 32, borderRadius: 999, background: 'white' }} />
          </div>
          <div style={{ width: 78, height: 58, borderRadius: 999, background: 'white' }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
