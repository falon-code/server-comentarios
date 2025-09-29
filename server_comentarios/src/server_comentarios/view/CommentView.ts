import { Router } from 'express';
import CommentController from "../controller/CommentController";
import { requireAuth } from "../middleware/auth";

export default class CommentView {
  public readonly router: Router;

  constructor(private readonly controller: CommentController) {
    this.router = Router();
    this.routes();
  }

  private routes() {

    // Alias más corto: /:tipo/:idOrOid/comments (solo comentarios)
    this.router.get('/:tipo/:idOrOid/comments', this.controller.listByPath);
    // Summary: producto + comentarios + stats
    this.router.get('/comments/:tipo/:idOrOid', this.controller.summaryByPath);
    // Crear comentario por ruta del recurso (auth)
    this.router.post('/:tipo/:idOrOid/comments', requireAuth, this.controller.createByPath);
    // Editar comentario (admin)
    this.router.put('/:tipo/:idOrOid/comments/:commentId', requireAuth, this.controller.updateByPath);
    // Eliminar un comentario usando la misma ruta base del recurso
    this.router.delete('/:tipo/:idOrOid/comments/:commentId', requireAuth, this.controller.removeByPath);
     // Responder a un comentario (auth)
    this.router.post('/:tipo/:idOrOid/comments/:commentId/replies', requireAuth, this.controller.replyByPath);
  // Crear comentario requiere auth
  this.router.post('/comments', requireAuth, this.controller.create);
  }
}
