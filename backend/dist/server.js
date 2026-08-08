"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const app_1 = require("./app");
const database_1 = require("./db/database");
function startServer(port) {
    return new Promise((resolve) => {
        (0, database_1.getDb)();
        const app = (0, app_1.createApp)();
        app.listen(port, () => {
            console.log(`Archivo Genealógico API running on http://localhost:${port}`);
            resolve();
        });
    });
}
if (require.main === module) {
    const port = Number(process.env.PORT) || 3001;
    startServer(port);
}
