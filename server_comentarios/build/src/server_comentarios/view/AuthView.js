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
        // Login: usa x-user / x-pass y devuelve token Bearer
        this.router.post('/login', auth_1.loginHandler, this.controller.login);
    }
}
exports.default = AuthView;
