import { Router } from 'express';
import ArmorController from '../controller/ArmorController';

export default class ArmorView {
  router: Router;
  constructor(private readonly armorController: ArmorController) {
    this.router = Router();
    this.routes();
  }

  readonly routes = (): void => {
    /**
     * @swagger
     * /armors:
     *   get:
     *     tags: [Armors]
     *     summary: Obtener lista de armaduras
     *     description: Retorna todas las armaduras disponibles en el inventario
     *     responses:
     *       200:
     *         description: Lista de armaduras obtenida exitosamente
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
     *                     $ref: '#/components/schemas/Armor'
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get('/armors', this.armorController.list); // filtrar todo
    
    /**
     * @swagger
     * /armors/{id}:
     *   get:
     *     tags: [Armors]
     *     summary: Obtener armadura por ID
     *     description: Retorna los detalles de una armadura específica
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único de la armadura
     *     responses:
     *       200:
     *         description: Armadura encontrada exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Armor'
     *       404:
     *         description: Armadura no encontrada
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
    this.router.get('/armors/:id', this.armorController.get); // detalle por id
  };
}