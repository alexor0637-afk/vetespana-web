// Slug SEO-friendly de una ciudad para las URLs limpias /veterinarios/{slug}
// («La Vall d'Uixó» → «la-vall-duixo»). Sin dependencias: lo usan types/clinic.ts,
// los componentes cliente y el build.
export function ciudadSlug(ciudad: string): string {
  return ciudad
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes/diacríticos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
