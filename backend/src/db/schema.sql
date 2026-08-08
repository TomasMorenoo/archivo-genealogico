PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS lugares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ciudad TEXT NOT NULL,
  provincia TEXT,
  pais TEXT NOT NULL,
  latitud REAL,
  longitud REAL,
  UNIQUE(ciudad, provincia, pais)
);

CREATE TABLE IF NOT EXISTS personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  sexo TEXT CHECK(sexo IN ('M','F','otro')) NOT NULL DEFAULT 'M',
  nac_dia INTEGER,
  nac_mes INTEGER,
  nac_anio INTEGER,
  nac_tipo TEXT CHECK(nac_tipo IN ('exacta','solo_anio','aproximada','desconocida')) DEFAULT 'desconocida',
  nac_lugar_id INTEGER REFERENCES lugares(id),
  def_dia INTEGER,
  def_mes INTEGER,
  def_anio INTEGER,
  def_tipo TEXT CHECK(def_tipo IN ('exacta','solo_anio','aproximada','desconocida')) DEFAULT 'desconocida',
  def_lugar_id INTEGER REFERENCES lugares(id),
  historia TEXT DEFAULT '',
  fallecida INTEGER NOT NULL DEFAULT 0,
  foto_ruta TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tipo_relacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  inverso_id INTEGER REFERENCES tipo_relacion(id)
);

CREATE TABLE IF NOT EXISTS relaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  persona_origen_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_relacion_id INTEGER NOT NULL REFERENCES tipo_relacion(id),
  persona_destino_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  UNIQUE(persona_origen_id, tipo_relacion_id, persona_destino_id)
);

CREATE TABLE IF NOT EXISTS documentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  doc_dia INTEGER,
  doc_mes INTEGER,
  doc_anio INTEGER,
  doc_fecha_tipo TEXT CHECK(doc_fecha_tipo IN ('exacta','solo_anio','aproximada','desconocida')) DEFAULT 'desconocida',
  descripcion TEXT DEFAULT '',
  ruta TEXT,
  nombre_original TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documento_personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  documento_id INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  persona_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  rol TEXT CHECK(rol IN ('principal','mencionada')) NOT NULL DEFAULT 'principal',
  UNIQUE(documento_id, persona_id, rol)
);

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  persona_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  dia INTEGER,
  mes INTEGER,
  anio INTEGER,
  fecha_tipo TEXT CHECK(fecha_tipo IN ('exacta','solo_anio','aproximada','desconocida')) DEFAULT 'desconocida',
  lugar_id INTEGER REFERENCES lugares(id),
  descripcion TEXT DEFAULT ''
);

INSERT OR IGNORE INTO tipo_relacion (id, nombre) VALUES
  (1, 'Padre'),
  (2, 'Madre'),
  (3, 'Hijo'),
  (4, 'Hija'),
  (5, 'Cónyuge'),
  (6, 'Padre biológico'),
  (7, 'Madre biológica'),
  (8, 'Padre adoptivo'),
  (9, 'Madre adoptiva'),
  (10, 'Hermano'),
  (11, 'Hermana'),
  (12, 'Hermano medio'),
  (13, 'Abuelo'),
  (14, 'Abuela'),
  (15, 'Bisabuelo'),
  (16, 'Bisabuela'),
  (17, 'Tutor'),
  (18, 'Otro');

UPDATE tipo_relacion SET inverso_id = 3 WHERE id = 1;
UPDATE tipo_relacion SET inverso_id = 4 WHERE id = 2;
UPDATE tipo_relacion SET inverso_id = 1 WHERE id = 3;
UPDATE tipo_relacion SET inverso_id = 2 WHERE id = 4;
UPDATE tipo_relacion SET inverso_id = 5 WHERE id = 5;
UPDATE tipo_relacion SET inverso_id = 3 WHERE id = 6;
UPDATE tipo_relacion SET inverso_id = 4 WHERE id = 7;
UPDATE tipo_relacion SET inverso_id = 3 WHERE id = 8;
UPDATE tipo_relacion SET inverso_id = 4 WHERE id = 9;
UPDATE tipo_relacion SET inverso_id = 10 WHERE id = 10;
UPDATE tipo_relacion SET inverso_id = 11 WHERE id = 11;
UPDATE tipo_relacion SET inverso_id = 12 WHERE id = 12;
UPDATE tipo_relacion SET inverso_id = 3 WHERE id = 13;
UPDATE tipo_relacion SET inverso_id = 4 WHERE id = 14;
