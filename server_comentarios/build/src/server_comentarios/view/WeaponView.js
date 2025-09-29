"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
class WeaponView {
    weaponController;
    router;
    constructor(weaponController) {
        this.weaponController = weaponController;
        this.router = (0, express_1.Router)();
        this.routes();
    }
    routes = () => {
        this.router.get('/weapons', this.weaponController.list); // filtrar todo
        this.router.get('/weapons/:id', this.weaponController.get); // detalle por id
    };
}
exports.default = WeaponView;
