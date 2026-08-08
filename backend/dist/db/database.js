"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const SCHEMA_PATH = path_1.default.join(__dirname, 'schema.sql');
let db;
function getDbPath() {
    const root = process.env.ARCHIVO_ROOT;
    if (!root) {
        return path_1.default.join(__dirname, '../../genealogico.db');
    }
    return path_1.default.join(root, 'BaseDeDatos', 'genealogico.db');
}
function getDb() {
    if (!db) {
        const dbPath = getDbPath();
        fs_1.default.mkdirSync(path_1.default.dirname(dbPath), { recursive: true });
        db = new better_sqlite3_1.default(dbPath);
        const schema = fs_1.default.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schema);
        try {
            db.exec('ALTER TABLE personas ADD COLUMN fallecida INTEGER NOT NULL DEFAULT 0');
        }
        catch { }
    }
    return db;
}
function closeDb() {
    if (db) {
        db.close();
        db = undefined;
    }
}
