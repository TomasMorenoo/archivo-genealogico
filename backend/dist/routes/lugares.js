"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lugaresRouter = void 0;
const express_1 = require("express");
const lugarService_1 = require("../services/lugarService");
exports.lugaresRouter = (0, express_1.Router)();
function parseAddress(r) {
    const a = r.address ?? {};
    const ciudad = a.city || a.town || a.village || a.hamlet || a.municipality || a.county || '';
    const provincia = a.state || a.province || a.region || null;
    const pais = a.country || '';
    return { ciudad, provincia, pais, lat: parseFloat(r.lat), lon: parseFloat(r.lon), display: r.display_name };
}
async function nominatimSearch(q) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&accept-language=es`;
    const res = await fetch(url, { headers: { 'User-Agent': 'ArchivoGenealogico/1.0' } });
    const data = await res.json();
    return data.map(parseAddress).filter(r => r.pais !== '');
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.lugaresRouter.get('/search', (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (q.length < 2)
        return res.json([]);
    res.json((0, lugarService_1.searchLugares)(q));
});
exports.lugaresRouter.get('/nominatim', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (!q)
        return res.json([]);
    try {
        const results = await nominatimSearch(q);
        res.json(results);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.lugaresRouter.get('/migrate', async (_req, res) => {
    try {
        const lugares = (0, lugarService_1.getAllLugares)();
        const result = [];
        for (const l of lugares) {
            const query = `${l.ciudad} ${l.provincia ?? ''} ${l.pais}`.trim();
            const hits = await nominatimSearch(query);
            const propuesto = hits.length > 0 ? { ciudad: hits[0].ciudad, provincia: hits[0].provincia, pais: hits[0].pais, lat: hits[0].lat, lon: hits[0].lon } : null;
            const cambia = propuesto !== null && (propuesto.ciudad !== l.ciudad ||
                propuesto.provincia !== l.provincia ||
                propuesto.pais !== l.pais);
            result.push({ id: l.id, actual: { ciudad: l.ciudad, provincia: l.provincia, pais: l.pais }, propuesto, cambia });
            await sleep(1100);
        }
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.lugaresRouter.post('/migrate', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids))
        return res.status(400).json({ error: 'ids required' });
    try {
        const lugares = (0, lugarService_1.getAllLugares)();
        for (const id of ids) {
            const l = lugares.find(x => x.id === id);
            if (!l)
                continue;
            const query = `${l.ciudad} ${l.provincia ?? ''} ${l.pais}`.trim();
            const hits = await nominatimSearch(query);
            if (hits.length > 0) {
                (0, lugarService_1.updateLugarById)(id, { ciudad: hits[0].ciudad, provincia: hits[0].provincia, pais: hits[0].pais, latitud: hits[0].lat, longitud: hits[0].lon });
            }
            await sleep(1100);
        }
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.lugaresRouter.post('/', (req, res) => {
    try {
        res.status(201).json((0, lugarService_1.upsertLugar)(req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
