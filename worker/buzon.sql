-- Base D1 "vetespana-buzon" (Cloudflare): bandeja de entrada de reseñas y altas.
-- Crear una vez:
--   npx wrangler d1 create vetespana-buzon          (su id va a D1_DATABASE_ID en .env)
--   npx wrangler d1 execute vetespana-buzon --remote --file worker/buzon.sql --config worker/wrangler.jsonc
-- El servidor de casa recoge y BORRA las filas cada noche (scripts/recoger-buzon.mjs).
CREATE TABLE IF NOT EXISTS buzon (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo     TEXT NOT NULL CHECK (tipo IN ('resena', 'alta')),
  datos    TEXT NOT NULL,
  recibido TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
