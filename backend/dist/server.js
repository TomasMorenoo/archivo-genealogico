"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
exports.stopServer = stopServer;
const app_1 = require("./app");
const database_1 = require("./db/database");
let server = null;
function startServer(port) {
    return new Promise((resolve) => {
        (0, database_1.getDb)();
        const app = (0, app_1.createApp)();
        server = app.listen(port, () => {
            console.log(`Archivo Genealógico API running on http://localhost:${port}`);
            resolve();
        });
    });
}
function stopServer() {
    return new Promise((resolve) => {
        (0, database_1.closeDb)();
        if (server) {
            server.close(() => resolve());
            server = null;
        }
        else {
            resolve();
        }
    });
}
if (require.main === module) {
    const port = Number(process.env.PORT) || 3001;
    startServer(port);
}
