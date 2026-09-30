// Tarjetas grises mientras se filtra el listado (mismo tamaño que las de verdad: sin saltos)
export default function EsqueletoListado() {
  return (
    <div aria-hidden>
      <div className="mb-5 h-8 w-2/3 max-w-md rounded-lg bg-gray-100" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="h-44 animate-pulse bg-gray-100" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-gray-100" />
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
