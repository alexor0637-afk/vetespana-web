-- Migración de la base D1 del buzón de la versión 1 a la 2 (28/09/2026):
-- tipo 'edicion' en buzon, fotos de los formularios (archivos) y límite de envíos.
--   npx wrangler d1 execute vetespana-buzon --remote --file worker/migracion-002.sql --config worker/wrangler.jsonc
-- SQLite no deja cambiar un CHECK: se crea la tabla nueva y se copian las filas.

CREATE TABLE buzon_v2 (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo     TEXT NOT NULL CHECK (tipo IN ('resena', 'alta', 'edicion')),
  datos    TEXT NOT NULL,
  recibido TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
INSERT INTO buzon_v2 (id, tipo, datos, recibido) SELECT id, tipo, datos, recibido FROM buzon;
DROP TABLE buzon;
ALTER TABLE buzon_v2 RENAME TO buzon;

CREATE TABLE IF NOT EXISTS archivos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  buzon_id INTEGER NOT NULL,
  tipo     TEXT NOT NULL,
  datos    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS archivos_buzon ON archivos (buzon_id);

CREATE TABLE IF NOT EXISTS limites (
  clave TEXT PRIMARY KEY,
  n     INTEGER NOT NULL
);
