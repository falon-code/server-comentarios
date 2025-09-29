import { Router } from 'express';
import ItemController from '../controller/ItemController';

export default class ItemView {
  router: Router;
  constructor(private readonly itemController: ItemController) {
    this.router = Router();
    this.routes();
  }
  readonly routes = () => {
    /**
     * @swagger
     * /items:
     *   get:
     *     tags: [Items]
     *     summary: Obtener lista de items
     *     description: Retorna todos los items disponibles en el inventario
     *     responses:
     *       200:
     *         description: Lista de items obtenida exitosamente
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
     *                     $ref: '#/components/schemas/Item'
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get('/items', this.itemController.list); // filtrar todo
    
    /**
     * @swagger
     * /items/{id}:
     *   get:
     *     tags: [Items]
     *     summary: Obtener item por ID
     *     description: Retorna los detalles de un item específico
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del item
     *     responses:
     *       200:
     *         description: Item encontrado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Item'
     *       404:
     *         description: Item no encontrado
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
    this.router.get('/items/:id', this.itemController.get); // detalle por id
  };
}