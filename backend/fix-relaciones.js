/**
 * Script para corregir relaciones con género incorrecto en la DB.
 * Uso: node fix-relaciones.js <ruta-a-genealogico.db>
 * Ejemplo: node fix-relaciones.js "C:\Users\Moren\Documents\DocumentacionArbol\BaseDeDatos\genealogico.db"
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.argv[2];
if (!dbPath) {
  console.error('Uso: node fix-relaciones.js <ruta-a-genealogico.db>');
  process.exit(1);
}

const db = new Database(dbPath);

// Para cada tipo genérico, devuelve el id correcto según el sexo
function corregirTipo(tipoId, sexo) {
  const esFemenino = sexo === 'F';
  const grupos = [
    [1, 2],   // Padre / Madre
    [3, 4],   // Hijo / Hija
    [6, 7],   // Padre biológico / Madre biológica
    [8, 9],   // Padre adoptivo / Madre adoptiva
    [10, 11], // Hermano / Hermana
    [13, 14], // Abuelo / Abuela
    [15, 16], // Bisabuelo / Bisabuela
  ];
  for (const [M, F] of grupos) {
    if (tipoId === M || tipoId === F) return esFemenino ? F : M;
  }
  return tipoId; // no es genérico, no cambia
}

const relaciones = db.prepare(`
  SELECT r.id, r.tipo_relacion_id, p.sexo
  FROM relaciones r
  JOIN personas p ON r.persona_destino_id = p.id
  WHERE r.tipo_relacion_id IN (1,2,3,4,6,7,8,9,10,11,13,14,15,16)
`).all();

let corregidas = 0;
const update = db.prepare('UPDATE relaciones SET tipo_relacion_id = ? WHERE id = ?');

db.transaction(() => {
  for (const rel of relaciones) {
    const correcto = corregirTipo(rel.tipo_relacion_id, rel.sexo);
    if (correcto !== rel.tipo_relacion_id) {
      update.run(correcto, rel.id);
      corregidas++;
    }
  }
})();

console.log(`Revisadas: ${relaciones.length} relaciones`);
console.log(`Corregidas: ${corregidas}`);
db.close();
