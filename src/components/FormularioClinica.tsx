'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { CheckCircle2, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import CitySelect from '@/components/CitySelect'
import HorarioEditor from '@/components/HorarioEditor'
import { ESPECIALIDADES, ESPECIALIDAD_EMOJI } from '@/types/clinic'
import { URL_BUZON, horarioATexto, horarioTipico, reducirFoto, textoAHorario } from '@/lib/formulario-clinica'

/** Lo que el formulario necesita de una clínica existente (modo edición) */
export interface DatosClinica {
  id: string
  slug: string
  nombre: string
  ciudad: string
  direccion: string
  telefono: string
  whatsapp?: string
  email?: string
  web?: string
  redesSociales?: string
  especialidades: string[]
  horario?: string
  urgencias24h: boolean
  descripcion?: string
}

interface Props {
  modo: 'alta' | 'edicion'
  clinica?: DatosClinica
}

const CAMPOS_TEXTO = ['nombre', 'direccion', 'telefono', 'whatsapp', 'email', 'web', 'redes', 'descripcion'] as const
const CARGOS = ['Propietario/a', 'Veterinario/a', 'Gerencia o administración', 'Recepción', 'Agencia o colaborador', 'Otro']

const claseCampo =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400'
const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const telefonoValido = (v: string) => v.replace(/\D/g, '').length >= 9

function Campo({ etiqueta, ayuda, obligatorio, children }: { etiqueta: string; ayuda?: string; obligatorio?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {etiqueta}
        {obligatorio && <span className="text-teal-700"> *</span>}
      </span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-gray-500">{ayuda}</span>}
    </label>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-gray-100 pt-6">
      <legend className="float-left mb-2 w-full text-base font-bold text-gray-900">{titulo}</legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  )
}

/**
 * Formulario de la web para dar de alta una clínica o pedir cambios en una existente.
 * Envía al buzón de Cloudflare (/altas o /ediciones); nada se publica sin que el dueño
 * de VetEspaña lo apruebe en NocoDB.
 */
export default function FormularioClinica({ modo, clinica }: Props) {
  const inicial = useMemo(
    () => ({
      nombre: clinica?.nombre ?? '',
      ciudad: clinica?.ciudad ?? '',
      ciudadOtra: '',
      direccion: clinica?.direccion ?? '',
      telefono: clinica?.telefono ?? '',
      whatsapp: clinica?.whatsapp ?? '',
      email: clinica?.email ?? '',
      web: clinica?.web ?? '',
      redes: clinica?.redesSociales ?? '',
      descripcion: clinica?.descripcion ?? '',
      especialidades: clinica?.especialidades ?? [],
      urgencias24h: clinica?.urgencias24h ?? false,
    }),
    [clinica],
  )
  const horarioLeido = useMemo(() => textoAHorario(clinica?.horario), [clinica])

  const [campos, setCampos] = useState(inicial)
  const [ciudadNoEsta, setCiudadNoEsta] = useState(false)
  const [horario, setHorario] = useState(() => horarioLeido ?? horarioTipico())
  const [horarioTocado, setHorarioTocado] = useState(false)
  const [foto, setFoto] = useState<{ datos: string; tipo: string; kb: number; vista: string } | null>(null)
  const [procesandoFoto, setProcesandoFoto] = useState(false)
  const [contacto, setContacto] = useState({ nombre: '', cargo: '', email: '', telefono: '' })
  const [mensaje, setMensaje] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [trampa, setTrampa] = useState('') // campo oculto: solo lo rellenan los robots
  const [estado, setEstado] = useState<'editando' | 'enviando' | 'enviado'>('editando')
  const [error, setError] = useState('')
  const inicio = useRef(0)

  useEffect(() => {
    inicio.current = Date.now()
  }, [])
  useEffect(() => () => {
    if (foto) URL.revokeObjectURL(foto.vista)
  }, [foto])

  const poner = <K extends keyof typeof campos>(campo: K, valor: (typeof campos)[K]) =>
    setCampos((c) => ({ ...c, [campo]: valor }))

  function alternarEspecialidad(nombre: string) {
    poner('especialidades', campos.especialidades.includes(nombre)
      ? campos.especialidades.filter((e) => e !== nombre)
      : [...campos.especialidades, nombre])
  }

  async function elegirFoto(archivo: File | undefined) {
    if (!archivo) return
    setError('')
    setProcesandoFoto(true)
    try {
      const reducida = await reducirFoto(archivo)
      setFoto({ ...reducida, vista: URL.createObjectURL(archivo) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No hemos podido usar esa foto')
    } finally {
      setProcesandoFoto(false)
    }
  }

  // En modo edición solo se envía lo que ha cambiado
  function cambios(): Record<string, unknown> {
    const c: Record<string, unknown> = {}
    for (const campo of CAMPOS_TEXTO) {
      if (campos[campo].trim() !== inicial[campo].trim()) c[campo] = campos[campo].trim()
    }
    if (ciudadNoEsta && campos.ciudadOtra.trim()) c.ciudadOtra = campos.ciudadOtra.trim()
    else if (!ciudadNoEsta && campos.ciudad && campos.ciudad !== inicial.ciudad) c.ciudad = campos.ciudad
    const ordenar = (l: string[]) => [...l].sort().join('|')
    if (ordenar(campos.especialidades) !== ordenar(inicial.especialidades)) c.especialidades = campos.especialidades
    if (campos.urgencias24h !== inicial.urgencias24h) c.urgencias24h = campos.urgencias24h
    if (horarioTocado) {
      const texto = horarioATexto(horario)
      if (texto !== (clinica?.horario ?? '')) c.horario = texto
    }
    return c
  }

  function comprobar(): string {
    if (modo === 'alta') {
      if (campos.nombre.trim().length < 2) return 'Falta el nombre de la clínica'
      if (ciudadNoEsta ? campos.ciudadOtra.trim().length < 2 : !campos.ciudad) return 'Falta la ciudad'
      if (campos.direccion.trim().length < 5) return 'Falta la dirección'
      if (!telefonoValido(campos.telefono)) return 'Revisa el teléfono de la clínica (al menos 9 cifras)'
    } else {
      if (campos.telefono.trim() && !telefonoValido(campos.telefono)) return 'Revisa el teléfono de la clínica (al menos 9 cifras)'
      if (!Object.keys(cambios()).length && !foto && !mensaje.trim()) return 'No has cambiado ningún dato'
    }
    if (campos.email.trim() && !emailValido(campos.email.trim())) return 'Revisa el email de la clínica'
    if (contacto.nombre.trim().length < 2) return 'Falta tu nombre'
    if (!contacto.email.trim() && !contacto.telefono.trim()) return 'Déjanos un email o un teléfono para contactarte'
    if (contacto.email.trim() && !emailValido(contacto.email.trim())) return 'Revisa tu email de contacto'
    if (!acepta) return 'Falta marcar la casilla del uso de los datos'
    return ''
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const problema = comprobar()
    if (problema) {
      setError(problema)
      return
    }
    setError('')
    setEstado('enviando')
    const comun = {
      contacto: {
        nombre: contacto.nombre.trim(),
        cargo: contacto.cargo,
        email: contacto.email.trim(),
        telefono: contacto.telefono.trim(),
      },
      mensaje: mensaje.trim(),
      acepta,
      website: trampa,
      ms: Date.now() - inicio.current,
      foto: foto ? { datos: foto.datos, tipo: foto.tipo } : null,
    }
    const cuerpo =
      modo === 'alta'
        ? {
            ...comun,
            clinica: {
              ...Object.fromEntries(CAMPOS_TEXTO.map((c) => [c, campos[c].trim()])),
              ciudad: ciudadNoEsta ? '' : campos.ciudad,
              ciudadOtra: ciudadNoEsta ? campos.ciudadOtra.trim() : '',
              horario: horarioATexto(horario),
              especialidades: campos.especialidades,
              urgencias24h: campos.urgencias24h,
            },
          }
        : { ...comun, clinicaId: clinica?.id, slug: clinica?.slug, clinicaNombre: clinica?.nombre, cambios: cambios() }
    try {
      const res = await fetch(`${URL_BUZON}/${modo === 'alta' ? 'altas' : 'ediciones'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      const respuesta = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(respuesta.error || 'No se ha podido enviar. Prueba otra vez en un momento.')
      setEstado('enviado')
    } catch (err) {
      setError(err instanceof Error && err.message !== 'Failed to fetch'
        ? err.message
        : 'No se ha podido enviar. Revisa tu conexión y prueba otra vez.')
      setEstado('editando')
    }
  }

  if (estado === 'enviado') {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-teal-600" size={36} />
        <h3 className="mb-2 text-lg font-bold text-gray-900">¡Recibido, gracias!</h3>
        <p className="text-sm text-gray-600">
          {modo === 'alta'
            ? 'Revisaremos los datos y, si todo está bien, publicaremos la clínica en VetEspaña. Si nos falta algo, te escribiremos.'
            : `Revisaremos los cambios y, si todo está bien, se verán en la ficha de ${clinica?.nombre}. Si tenemos dudas, te contactaremos.`}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      {modo === 'edicion' && (
        <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          Cambia solo lo que no esté bien. Revisamos cada cambio antes de publicarlo, y puede que te llamemos para confirmarlo.
        </p>
      )}

      <Seccion titulo="Datos de la clínica">
        <Campo etiqueta="Nombre de la clínica" obligatorio={modo === 'alta'}>
          <input className={claseCampo} value={campos.nombre} onChange={(e) => poner('nombre', e.target.value)} maxLength={120} autoComplete="organization" />
        </Campo>
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Ciudad{modo === 'alta' && <span className="text-teal-700"> *</span>}
          </span>
          {ciudadNoEsta ? (
            <input
              className={claseCampo}
              value={campos.ciudadOtra}
              onChange={(e) => poner('ciudadOtra', e.target.value)}
              maxLength={80}
              placeholder="Escribe la ciudad o el pueblo"
              aria-label="Ciudad"
            />
          ) : (
            <CitySelect
              id="formulario-ciudades"
              value={campos.ciudad}
              onChange={(v) => poner('ciudad', v)}
              placeholder="Busca la ciudad"
              opcionVacia="Sin elegir"
              etiqueta="Ciudad de la clínica"
            />
          )}
          <button type="button" onClick={() => setCiudadNoEsta(!ciudadNoEsta)} className="mt-1 text-xs font-medium text-teal-700 hover:underline">
            {ciudadNoEsta ? 'Elegir de la lista' : '¿No encuentras la ciudad? Escríbela'}
          </button>
        </div>
        <Campo etiqueta="Dirección" obligatorio={modo === 'alta'} ayuda="Calle, número y código postal">
          <input className={claseCampo} value={campos.direccion} onChange={(e) => poner('direccion', e.target.value)} maxLength={200} autoComplete="street-address" />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Teléfono" obligatorio={modo === 'alta'}>
            <input className={claseCampo} type="tel" value={campos.telefono} onChange={(e) => poner('telefono', e.target.value)} maxLength={40} />
          </Campo>
          <Campo etiqueta="WhatsApp" ayuda="Si atendéis por WhatsApp">
            <input className={claseCampo} type="tel" value={campos.whatsapp} onChange={(e) => poner('whatsapp', e.target.value)} maxLength={40} />
          </Campo>
          <Campo etiqueta="Email de la clínica">
            <input className={claseCampo} type="email" value={campos.email} onChange={(e) => poner('email', e.target.value)} maxLength={120} />
          </Campo>
          <Campo etiqueta="Web">
            <input className={claseCampo} value={campos.web} onChange={(e) => poner('web', e.target.value)} maxLength={200} placeholder="www.tuclinica.es" />
          </Campo>
        </div>
        <Campo etiqueta="Redes sociales" ayuda="Instagram, Facebook… (un enlace)">
          <input className={claseCampo} value={campos.redes} onChange={(e) => poner('redes', e.target.value)} maxLength={200} />
        </Campo>
      </Seccion>

      <Seccion titulo="Horario">
        {modo === 'edicion' && clinica?.horario && !horarioLeido && !horarioTocado && (
          <p className="whitespace-pre-line rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
            Horario actual en la web: {clinica.horario}
          </p>
        )}
        {modo === 'alta' && <p className="text-xs text-gray-500">Viene puesto un horario habitual: cámbialo por el vuestro.</p>}
        <HorarioEditor
          valor={horario}
          onChange={(v) => {
            setHorario(v)
            setHorarioTocado(true)
          }}
        />
      </Seccion>

      <Seccion titulo="Qué ofrecéis">
        <div className="flex flex-wrap gap-2">
          {ESPECIALIDADES.map((esp) => {
            const marcada = campos.especialidades.includes(esp)
            return (
              <button
                type="button"
                key={esp}
                aria-pressed={marcada}
                onClick={() => alternarEspecialidad(esp)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  marcada ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
                }`}
              >
                {ESPECIALIDAD_EMOJI[esp]} {esp}
              </button>
            )
          })}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={campos.urgencias24h} onChange={(e) => poner('urgencias24h', e.target.checked)} className="h-4 w-4 accent-teal-600" />
          Atendemos urgencias las 24 horas
        </label>
        <Campo etiqueta="Descripción" ayuda={`Qué os hace especiales, instalaciones, equipo… (${campos.descripcion.length}/1000)`}>
          <textarea className={`${claseCampo} resize-y`} rows={4} value={campos.descripcion} onChange={(e) => poner('descripcion', e.target.value)} maxLength={1000} />
        </Campo>
      </Seccion>

      <Seccion titulo={modo === 'alta' ? 'Foto de la clínica' : 'Foto nueva (opcional)'}>
        {foto ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto.vista} alt="Foto elegida" className="h-24 w-32 rounded-xl object-cover" />
            <div className="text-sm text-gray-600">
              <p>Lista ({foto.kb} KB).</p>
              <button type="button" onClick={() => setFoto(null)} className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                <Trash2 size={13} /> Quitar
              </button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600 hover:border-teal-400">
            {procesandoFoto ? <Loader2 size={20} className="animate-spin text-teal-600" /> : <ImagePlus size={20} className="text-teal-600" />}
            <span>{procesandoFoto ? 'Preparando la foto…' : 'Elige una foto de la fachada o del interior (JPG o PNG)'}</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => elegirFoto(e.target.files?.[0])} />
          </label>
        )}
      </Seccion>

      <Seccion titulo="Tus datos">
        <p className="text-xs text-gray-500">Solo para comprobar la información o contactarte si hace falta. No se publican.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Tu nombre" obligatorio>
            <input className={claseCampo} value={contacto.nombre} onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })} maxLength={80} autoComplete="name" />
          </Campo>
          <Campo etiqueta="Tu relación con la clínica">
            <select className={claseCampo} value={contacto.cargo} onChange={(e) => setContacto({ ...contacto, cargo: e.target.value })}>
              <option value="">Elige una opción</option>
              {CARGOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Tu email">
            <input className={claseCampo} type="email" value={contacto.email} onChange={(e) => setContacto({ ...contacto, email: e.target.value })} maxLength={120} autoComplete="email" />
          </Campo>
          <Campo etiqueta="Tu teléfono" ayuda="Email o teléfono: al menos uno de los dos">
            <input className={claseCampo} type="tel" value={contacto.telefono} onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })} maxLength={40} autoComplete="tel" />
          </Campo>
        </div>
        <Campo etiqueta="¿Algo más que debamos saber?">
          <textarea className={`${claseCampo} resize-y`} rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={1000} />
        </Campo>
      </Seccion>

      {/* Trampa para robots: invisible para las personas */}
      <input
        type="text"
        name="website"
        value={trampa}
        onChange={(e) => setTrampa(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-teal-600" />
        <span>
          Acepto que VetEspaña use estos datos para {modo === 'alta' ? 'publicar la clínica' : 'actualizar la ficha'} y para contactarme sobre
          ella. Puedes pedir que los borremos escribiendo a hola@vetespana.es.
        </span>
      </label>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={estado === 'enviando' || procesandoFoto}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400"
      >
        {estado === 'enviando' && <Loader2 size={16} className="animate-spin" />}
        {estado === 'enviando' ? 'Enviando…' : modo === 'alta' ? 'Enviar la clínica' : 'Enviar los cambios'}
      </button>
    </form>
  )
}
