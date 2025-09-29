"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
class ItemView {
    itemController;
    router;
    constructor(itemController) {
        this.itemController = itemController;
        this.router = (0, express_1.Router)();
        this.routes();
    }
    routes = () => {
        this.router.get('/items', this.itemController.list); // filtrar todo
        this.router.get('/items/:id', this.itemController.get); // detalle por id
    };
}
exports.default = ItemView;
