'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/**
 * "Sello" para que la clínica lo ponga en su web. El código es un enlace
 * (dofollow) hacia su ficha de VetEspaña → cada clínica que lo use nos da un
 * backlink de calidad. Pensado para que lo vea el dueño de la clínica al
 * visitar su propia ficha.
 */
export default function SelloClinica({ slug, nombre }: { slug: string; nombre: string }) {
  const url = `https://www.vetespana.es/clinicas/${slug}`
  // Sello autocontenido (estilos en línea) para que se vea bien en cualquier web.
  const code =
    `<a href="${url}" target="_blank" rel="noopener" ` +
    `style="display:inline-flex;align-items:center;gap:8px;font-family:system-ui,-apple-system,sans-serif;` +
    `font-size:14px;color:#ffffff;background:#0d9488;padding:8px 16px;border-radius:9999px;text-decoration:none;">` +
    `<span style="font-size:16px;line-height:1">&#128062;</span>` +
    `<span>Estamos en <strong>VetEspa&ntilde;a</strong></span></a>`

  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="bg-teal-50/60 rounded-2xl border border-teal-100 p-5">
      <h2 className="font-bold text-gray-900 mb-1">¿Es tu clínica? Añade nuestro sello a tu web</h2>
      <p className="text-sm text-gray-600 mb-4">
        Demuestra a tus clientes que <strong>{nombre}</strong> está en VetEspaña. Copia este código
        y pégalo en tu web (por ejemplo, en el pie de página). Es gratis.
      </p>

      {/* Vista previa del sello */}
      <div className="mb-4">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'system-ui,-apple-system,sans-serif',
            fontSize: 14,
            color: '#ffffff',
            background: '#0d9488',
            padding: '8px 16px',
            borderRadius: 9999,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>🐾</span>
          <span>
            Estamos en <strong>VetEspaña</strong>
          </span>
        </span>
      </div>

      {/* Código para copiar */}
      <div className="relative">
        <textarea
          readOnly
          value={code}
          rows={3}
          onClick={(e) => e.currentTarget.select()}
          className="w-full text-xs font-mono bg-white border border-gray-200 rounded-xl p-3 pr-3 text-gray-600 resize-none"
        />
        <button
          type="button"
          onClick={copy}
          className="mt-2 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {copied ? <><Check size={15} /> ¡Copiado!</> : <><Copy size={15} /> Copiar código</>}
        </button>
      </div>
    </div>
  )
}
