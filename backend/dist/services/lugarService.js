"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchLugares = searchLugares;
exports.getAllLugares = getAllLugares;
exports.updateLugarById = updateLugarById;
exports.upsertLugar = upsertLugar;
const database_1 = require("../db/database");
function searchLugares(q) {
    const search = `%${q}%`;
    return (0, database_1.getDb)().prepare(`
    SELECT * FROM lugares
    WHERE ciudad LIKE ? OR provincia LIKE ? OR pais LIKE ?
    ORDER BY ciudad, provincia, pais
    LIMIT 20
  `).all(search, search, search);
}
function getAllLugares() {
    return (0, database_1.getDb)().prepare('SELECT * FROM lugares ORDER BY id').all();
}
function updateLugarById(id, data) {
    (0, database_1.getDb)().prepare('UPDATE lugares SET ciudad=?, provincia=?, pais=?, latitud=?, longitud=? WHERE id=?')
        .run(data.ciudad, data.provincia, data.pais, data.latitud, data.longitud, id);
}
function upsertLugar(input) {
    const db = (0, database_1.getDb)();
    db.prepare(`
    INSERT INTO lugares (ciudad, provincia, pais, latitud, longitud)
    VALUES (@ciudad, @provincia, @pais, @latitud, @longitud)
    ON CONFLICT(ciudad, provincia, pais) DO UPDATE SET
      latitud = COALESCE(@latitud, latitud),
      longitud = COALESCE(@longitud, longitud)
  `).run({
        ciudad: input.ciudad,
        provincia: input.provincia ?? null,
        pais: input.pais,
        latitud: input.latitud ?? null,
        longitud: input.longitud ?? null,
    });
    return db.prepare('SELECT * FROM lugares WHERE ciudad = ? AND pais = ? AND (provincia = ? OR (provincia IS NULL AND ? IS NULL))').get(input.ciudad, input.pais, input.provincia ?? null, input.provincia ?? null);
}
