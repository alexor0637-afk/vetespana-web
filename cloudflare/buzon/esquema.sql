-- Esquema de la base D1 "vetespana-buzon" (bandeja de entrada del Worker).
-- Crear desde cero:
--   npx wrangler d1 execute vetespana-buzon --remote --file cloudflare/buzon/esquema.sql --config cloudflare/buzon/wrangler.jsonc
-- (Desde una base con la versión 1, aplicar cloudflare/buzon/migracion-002.sql.)

-- Envíos pendientes de pasar a Postgres (el servidor los recoge y los borra)
CREATE TABLE IF NOT EXISTS buzon (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo     TEXT NOT NULL CHECK (tipo IN ('resena', 'alta', 'edicion')),
  datos    TEXT NOT NULL,
  recibido TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Fotos de los formularios de alta y edición (base64), aparte para que las filas del
-- buzón sean ligeras. Se borran junto con su envío.
CREATE TABLE IF NOT EXISTS archivos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  buzon_id INTEGER NOT NULL,
  tipo     TEXT NOT NULL,
  datos    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS archivos_buzon ON archivos (buzon_id);

-- Límite de envíos por persona y hora (la IP se guarda resumida, no tal cual)
CREATE TABLE IF NOT EXISTS limites (
  clave TEXT PRIMARY KEY,
  n     INTEGER NOT NULL
);
