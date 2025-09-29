"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userStore = exports.UserStore = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class UserStore {
    users = [];
    constructor() {
        try {
            // Allow overriding the users file location via env (e.g., to mount a volume)
            const p = process.env["USERS_FILE"] || (0, path_1.join)(process.cwd(), 'database', 'users.json');
            const raw = (0, fs_1.readFileSync)(p, 'utf-8');
            this.users = JSON.parse(raw);
            if (!Array.isArray(this.users))
                throw new Error('users.json debe ser un arreglo');
        }
        catch (e) {
            console.warn('[Auth] No se pudo cargar database/users.json:', e.message);
            this.users = [];
        }
    }
    find(username, password) {
        return this.users.find(u => u.username === username && u.password === password);
    }
}
exports.UserStore = UserStore;
exports.userStore = new UserStore();
