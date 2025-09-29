"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
class CommentView {
    controller;
    router;
    constructor(controller) {
        this.controller = controller;
        this.router = (0, express_1.Router)();
        this.routes();
    }
    routes() {
        // Alias más corto: /:tipo/:idOrOid/comments (solo comentarios)
        this.router.get('/:tipo/:idOrOid/comments', this.controller.listByPath);
        // Summary: producto + comentarios + stats
        this.router.get('/comments/:tipo/:idOrOid', this.controller.summaryByPath);
        // Crear comentario por ruta del recurso (auth)
        this.router.post('/:tipo/:idOrOid/comments', auth_1.requireAuth, this.controller.createByPath);
        // Editar comentario (admin)
        this.router.put('/:tipo/:idOrOid/comments/:commentId', auth_1.requireAuth, this.controller.updateByPath);
        // Eliminar un comentario usando la misma ruta base del recurso
        this.router.delete('/:tipo/:idOrOid/comments/:commentId', auth_1.requireAuth, this.controller.removeByPath);
        // Responder a un comentario (auth)
        this.router.post('/:tipo/:idOrOid/comments/:commentId/replies', auth_1.requireAuth, this.controller.replyByPath);
        // Crear comentario requiere auth
        this.router.post('/comments', auth_1.requireAuth, this.controller.create);
    }
}
exports.default = CommentView;
