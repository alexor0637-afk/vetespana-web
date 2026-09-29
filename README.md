# VetEspaña — web

Directorio de clínicas veterinarias en España: https://www.vetespana.es

- **Web estática** (Next.js con `output: 'export'`): se genera en el servidor de casa desde
  Postgres (`src/lib/datos.ts`) y se publica en Cloudflare (`wrangler.jsonc`, solo archivos).
- **Buzón de formularios** (reseñas, altas y cambios): Worker aparte en `worker/` con D1.
- **Scripts del servidor** en `scripts/`: recoger el buzón, publicar altas, aplicar cambios,
  geocodificar y comprobar la web antes de publicarla.

La publicación la hace `~/homelab/vetespana-web/publicar.sh` en el servidor (cron cada
10 minutos si hay cambios, y completa a las 04:30). El `npm run build` local no funciona
sin acceso a la base. Antes de subir cambios: `npx tsc --noEmit && npx eslint src worker scripts`.

Documentación completa: `CLAUDE.md` (carpeta del proyecto) y los README de `~/homelab`.
