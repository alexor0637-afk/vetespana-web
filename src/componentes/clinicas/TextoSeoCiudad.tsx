import { textoSeoLugar, buildCityFaq } from '@/utilidades/contenido-ciudad'
import { jsonLdSeguro } from '@/utilidades/seo'

interface Props {
  lugarDisplay: string
  total: number
  count24h: number
  topEsp: string[]
  especialidad?: string
}

// Bloque de contenido SEO de una página de ciudad/comunidad: texto único + datos
// reales de la zona + FAQ visible + JSON-LD FAQPage. Compartido por /clinicas y
// la ruta limpia /veterinarios/[ciudad] para no divergir.
export default function TextoSeoCiudad({ lugarDisplay, total, count24h, topEsp, especialidad }: Props) {
  const faq = buildCityFaq(lugarDisplay, total, count24h, topEsp)

  return (
    <>
      <div className="mt-14 max-w-3xl text-sm text-gray-500 space-y-3 border-t border-gray-100 pt-8">
        <h2 className="text-base font-semibold text-gray-700">Clínicas veterinarias en {lugarDisplay}</h2>
        {textoSeoLugar(lugarDisplay, total, especialidad).map((p, i) => (
          <p key={i}>{p}</p>
        ))}

        {total > 0 && (
          <p>
            {total === 1 ? (
              <>
                La clínica veterinaria que tenemos en {lugarDisplay}{' '}
                {count24h > 0 ? 'ofrece urgencias 24 horas.' : 'no tiene urgencias 24h listadas.'}
              </>
            ) : (
              <>
                De las <strong>{total}</strong> clínicas veterinarias en {lugarDisplay},{' '}
                {count24h > 0 ? (
                  <>
                    <strong>{count24h}</strong> ofrece{count24h !== 1 ? 'n' : ''} urgencias 24 horas.
                  </>
                ) : (
                  <>aún no tenemos ninguna con urgencias 24h listada.</>
                )}
              </>
            )}
            {topEsp.length > 0 && <> Especialidades destacadas en la zona: {topEsp.join(', ')}.</>}
          </p>
        )}

        {faq.length > 0 && (
          <div className="pt-4 space-y-4">
            <h2 className="text-base font-semibold text-gray-700">
              Preguntas frecuentes sobre veterinarios en {lugarDisplay}
            </h2>
            {faq.map((item, i) => (
              <div key={i}>
                <h3 className="font-medium text-gray-700">{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdSeguro({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faq.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            }),
          }}
        />
      )}
    </>
  )
}
