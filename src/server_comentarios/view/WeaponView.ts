import { Router } from 'express';
import WeaponController from '../controller/WeaponController';

export default class WeaponView {
  router: Router;
  constructor(private readonly weaponController: WeaponController) {
    this.router = Router();
    this.routes();
  }
  readonly routes = () => {
    /**
     * @swagger
     * /weapons:
     *   get:
     *     tags: [Weapons]
     *     summary: Obtener lista de armas
     *     description: Retorna todas las armas disponibles en el inventario
     *     responses:
     *       200:
     *         description: Lista de armas obtenida exitosamente
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
     *                     $ref: '#/components/schemas/Weapon'
     *       500:
     *         description: Error interno del servidor
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get('/weapons', this.weaponController.list); // filtrar todo

    /**
     * @swagger
     * /weapons/{id}:
     *   get:
     *     tags: [Weapons]
     *     summary: Obtener arma por ID
     *     description: Retorna los detalles de un arma específica
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del arma
     *     responses:
     *       200:
     *         description: Arma encontrada exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Weapon'
     *       404:
     *         description: Arma no encontrada
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
    this.router.get('/weapons/:id', this.weaponController.get); // detalle por id
  };
}
