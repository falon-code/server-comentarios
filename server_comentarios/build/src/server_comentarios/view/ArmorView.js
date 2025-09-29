"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
class ArmorView {
    armorController;
    router;
    constructor(armorController) {
        this.armorController = armorController;
        this.router = (0, express_1.Router)();
        this.routes();
    }
    routes = () => {
        this.router.get('/armors', this.armorController.list); // filtrar todo
        this.router.get('/armors/:id', this.armorController.get); // detalle por id
    };
}
exports.default = ArmorView;
