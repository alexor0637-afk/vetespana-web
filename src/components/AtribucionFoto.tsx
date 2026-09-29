// Atribución de las fotos que vienen de Google Maps (Google Places): las condiciones de
// Google piden indicar la fuente allí donde se muestra la foto. No se guardó el autor de
// cada foto, así que se atribuye a «Google Maps» (texto sin modificar, bien legible).
export default function AtribucionFoto({ grande = false }: { grande?: boolean }) {
  return (
    <span
      className={`absolute z-10 rounded bg-black/60 font-medium leading-tight text-white ${
        grande ? 'bottom-2.5 left-2.5 px-2 py-1 text-xs' : 'bottom-1.5 left-1.5 px-1.5 py-0.5 text-[10px]'
      }`}
    >
      Foto: Google Maps
    </span>
  )
}
