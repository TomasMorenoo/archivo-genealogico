"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lugaresRouter = void 0;
const express_1 = require("express");
const lugarService_1 = require("../services/lugarService");
exports.lugaresRouter = (0, express_1.Router)();
exports.lugaresRouter.get('/search', (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (q.length < 2)
        return res.json([]);
    res.json((0, lugarService_1.searchLugares)(q));
});
exports.lugaresRouter.post('/', (req, res) => {
    try {
        res.status(201).json((0, lugarService_1.upsertLugar)(req.body));
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
