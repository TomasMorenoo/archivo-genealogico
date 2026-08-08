"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fileSystemService_1 = require("./services/fileSystemService");
const personas_1 = require("./routes/personas");
const relaciones_1 = require("./routes/relaciones");
const documentos_1 = require("./routes/documentos");
const lugares_1 = require("./routes/lugares");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use('/uploads', express_1.default.static((0, fileSystemService_1.getDataRoot)()));
    app.use('/api/personas', personas_1.personasRouter);
    app.use('/api/relaciones', relaciones_1.relacionesRouter);
    app.use('/api/documentos', documentos_1.documentosRouter);
    app.use('/api/lugares', lugares_1.lugaresRouter);
    return app;
}
