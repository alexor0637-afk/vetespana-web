import type { Metadata } from 'next'
import AltaClinica from '@/components/AltaClinica'
import { metadatosPagina } from '@/lib/seo'

export const metadata: Metadata = metadatosPagina({
  title: 'Añade tu clínica veterinaria',
  description:
    'Registra tu clínica veterinaria en VetEspaña gratis, o actualiza sus datos si ya aparece. Llega a los dueños de mascotas que buscan veterinario en tu ciudad.',
  ruta: '/alta-clinica',
})

export default function AltaClinicaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Añade tu clínica veterinaria gratis</h1>
        <p className="text-lg text-gray-500">
          Llega a los dueños de mascotas que buscan veterinario en tu ciudad. Si tu clínica ya aparece, aquí puedes actualizar sus datos.
        </p>
      </div>

      <AltaClinica />

      {/* Cómo funciona */}
      <div className="mt-10 rounded-2xl bg-gray-50 p-6">
        <h2 className="mb-4 text-center font-bold text-gray-900">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
          {[
            { n: '1', title: 'Busca o rellena', desc: 'Busca tu clínica para actualizarla o, si no está, añádela en 5 minutos.' },
            { n: '2', title: 'La revisamos', desc: 'Comprobamos los datos a mano, normalmente en uno o dos días.' },
            { n: '3', title: '¡Ya estás online!', desc: 'En cuanto la aprobamos, sale en la web en unos minutos.' },
          ].map((step) => (
            <div key={step.n}>
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700">
                {step.n}
              </div>
              <div className="mb-1 text-sm font-semibold text-gray-800">{step.title}</div>
              <div className="text-xs text-gray-500">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
