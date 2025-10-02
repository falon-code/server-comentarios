"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
class AuthView {
    controller;
    router;
    constructor(controller) {
        this.controller = controller;
        this.router = (0, express_1.Router)();
        this.routes();
    }
    routes() {
        /**
         * @swagger
         * /login:
         *   post:
         *     tags: [Auth]
         *     summary: Iniciar sesión
         *     description: Autentica un usuario y devuelve un token Bearer
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/LoginCredentials'
         *         application/x-www-form-urlencoded:
         *           schema:
         *             $ref: '#/components/schemas/LoginCredentials'
         *     responses:
         *       200:
         *         description: Login exitoso
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/AuthResponse'
         *       401:
         *         description: Credenciales inválidas
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Error'
         *       400:
         *         description: Datos de entrada inválidos
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Error'
         *       500:
         *         description: Error interno del servidor
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Error'
         */
        // Login: usa x-user / x-pass y devuelve token Bearer
        this.router.post('/login', auth_1.loginHandler, this.controller.login);
    }
}
exports.default = AuthView;
