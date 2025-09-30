import { Router } from 'express';
import CommentController from '../controller/CommentController';
import { requireAuth } from '../middleware/auth';

export default class CommentView {
  public readonly router: Router;

  constructor(private readonly controller: CommentController) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    /**
     * @swagger
     * /{tipo}/{idOrOid}/comments:
     *   get:
     *     tags: [Comments]
     *     summary: Obtener comentarios de un recurso
     *     description: Retorna todos los comentarios asociados a un recurso específico (armor, item o weapon)
     *     parameters:
     *       - in: path
     *         name: tipo
     *         required: true
     *         schema:
     *           type: string
     *           enum: [armors, items, weapons]
     *         description: Tipo de recurso
     *       - in: path
     *         name: idOrOid
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del recurso
     *     responses:
     *       200:
     *         description: Lista de comentarios obtenida exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Comment'
     *       404:
     *         description: Recurso no encontrado
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
    // Alias más corto: /:tipo/:idOrOid/comments (solo comentarios)
    this.router.get('/:tipo/:idOrOid/comments', this.controller.listByPath);

    /**
     * @swagger
     * /comments/{tipo}/{idOrOid}:
     *   get:
     *     tags: [Comments]
     *     summary: Obtener resumen completo del recurso
     *     description: Retorna información del producto junto con sus comentarios y estadísticas
     *     parameters:
     *       - in: path
     *         name: tipo
     *         required: true
     *         schema:
     *           type: string
     *           enum: [armors, items, weapons]
     *         description: Tipo de recurso
     *       - in: path
     *         name: idOrOid
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del recurso
     *     responses:
     *       200:
     *         description: Resumen obtenido exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     product:
     *                       oneOf:
     *                         - $ref: '#/components/schemas/Armor'
     *                         - $ref: '#/components/schemas/Item'
     *                         - $ref: '#/components/schemas/Weapon'
     *                     comments:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Comment'
     *                     stats:
     *                       type: object
     *                       properties:
     *                         totalComments:
     *                           type: number
     *       404:
     *         description: Recurso no encontrado
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
    // Summary: producto + comentarios + stats
    this.router.get('/comments/:tipo/:idOrOid', this.controller.summaryByPath);

    /**
     * @swagger
     * /{tipo}/{idOrOid}/comments:
     *   post:
     *     tags: [Comments]
     *     summary: Crear comentario en un recurso
     *     description: Crea un nuevo comentario asociado a un recurso específico
     *     security:
     *       - BearerAuth: []
     *       - UserAuth: []
     *     parameters:
     *       - in: path
     *         name: tipo
     *         required: true
     *         schema:
     *           type: string
     *           enum: [armors, items, weapons]
     *         description: Tipo de recurso
     *       - in: path
     *         name: idOrOid
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del recurso
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CommentInput'
     *     responses:
     *       201:
     *         description: Comentario creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Comment'
     *       400:
     *         description: Datos de entrada inválidos
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: No autorizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Recurso no encontrado
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
    // Crear comentario por ruta del recurso (auth)
    this.router.post('/:tipo/:idOrOid/comments', requireAuth, this.controller.createByPath);

    /**
     * @swagger
     * /{tipo}/{idOrOid}/comments/{commentId}:
     *   put:
     *     tags: [Comments]
     *     summary: Editar comentario
     *     description: Edita un comentario existente (requiere permisos de administrador)
     *     security:
     *       - BearerAuth: []
     *       - UserAuth: []
     *     parameters:
     *       - in: path
     *         name: tipo
     *         required: true
     *         schema:
     *           type: string
     *           enum: [armors, items, weapons]
     *         description: Tipo de recurso
     *       - in: path
     *         name: idOrOid
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del recurso
     *       - in: path
     *         name: commentId
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del comentario
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CommentInput'
     *     responses:
     *       200:
     *         description: Comentario actualizado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Comment'
     *       400:
     *         description: Datos de entrada inválidos
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: No autorizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       403:
     *         description: Acceso denegado (requiere rol de administrador)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Comentario no encontrado
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
    // Editar comentario (admin)
    this.router.put('/:tipo/:idOrOid/comments/:commentId', requireAuth, this.controller.updateByPath);

    /**
     * @swagger
     * /{tipo}/{idOrOid}/comments/{commentId}:
     *   delete:
     *     tags: [Comments]
     *     summary: Eliminar comentario
     *     description: Elimina un comentario existente
     *     security:
     *       - BearerAuth: []
     *       - UserAuth: []
     *     parameters:
     *       - in: path
     *         name: tipo
     *         required: true
     *         schema:
     *           type: string
     *           enum: [armors, items, weapons]
     *         description: Tipo de recurso
     *       - in: path
     *         name: idOrOid
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del recurso
     *       - in: path
     *         name: commentId
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del comentario
     *     responses:
     *       200:
     *         description: Comentario eliminado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "Comentario eliminado exitosamente"
     *       401:
     *         description: No autorizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Comentario no encontrado
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
    // Eliminar un comentario usando la misma ruta base del recurso
    this.router.delete('/:tipo/:idOrOid/comments/:commentId', requireAuth, this.controller.removeByPath);

    /**
     * @swagger
     * /{tipo}/{idOrOid}/comments/{commentId}/replies:
     *   post:
     *     tags: [Comments]
     *     summary: Responder a un comentario
     *     description: Crea una respuesta a un comentario existente
     *     security:
     *       - BearerAuth: []
     *       - UserAuth: []
     *     parameters:
     *       - in: path
     *         name: tipo
     *         required: true
     *         schema:
     *           type: string
     *           enum: [armors, items, weapons]
     *         description: Tipo de recurso
     *       - in: path
     *         name: idOrOid
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del recurso
     *       - in: path
     *         name: commentId
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del comentario padre
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CommentInput'
     *     responses:
     *       201:
     *         description: Respuesta creada exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Comment'
     *       400:
     *         description: Datos de entrada inválidos
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: No autorizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Comentario padre no encontrado
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
    // Responder a un comentario (auth)
    this.router.post('/:tipo/:idOrOid/comments/:commentId/replies', requireAuth, this.controller.replyByPath);

    /**
     * @swagger
     * /comments:
     *   post:
     *     tags: [Comments]
     *     summary: Crear comentario directo
     *     description: Crea un comentario directamente sin especificar la ruta del recurso
     *     security:
     *       - BearerAuth: []
     *       - UserAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             allOf:
     *               - $ref: '#/components/schemas/CommentInput'
     *               - type: object
     *                 required: [resourceType, resourceId]
     *                 properties:
     *                   resourceType:
     *                     type: string
     *                     enum: [armors, items, weapons]
     *                     description: Tipo de recurso
     *                   resourceId:
     *                     type: string
     *                     description: ID del recurso
     *     responses:
     *       201:
     *         description: Comentario creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Comment'
     *       400:
     *         description: Datos de entrada inválidos
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: No autorizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Recurso no encontrado
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
    // Crear comentario requiere auth
    this.router.post('/comments', requireAuth, this.controller.create);
  }
}
