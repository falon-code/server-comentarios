import { Router } from 'express';
import EpicaController from '../controller/EpicaController';

export default class EpicaView {
  router: Router;
  constructor(private readonly epicaController: EpicaController) {
    this.router = Router();
    this.routes();
  }

  readonly routes = (): void => {
    /**
     * @swagger
     * /epicas:
     *   get:
     *     tags: [Epicas]
     *     summary: Obtener lista de épicas
     *     description: Retorna todas las épicas disponibles en el inventario
     *     responses:
     *       200:
     *         description: Lista de épicas obtenida exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Epica'
     *       500:
     *         description: Error interno del servidor
     */
    this.router.get('/epicas', this.epicaController.list);

    /**
     * @swagger
     * /epicas/{id}:
     *   get:
     *     tags: [Epicas]
     *     summary: Obtener épica por ID
     *     description: Retorna los detalles de una épica específica
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID lógico numérico de la épica
     *     responses:
     *       200:
     *         description: Épica encontrada exitosamente
     *       404:
     *         description: Épica no encontrada
     *       500:
     *         description: Error interno del servidor
     */
    this.router.get('/epicas/:id', this.epicaController.get);
  };
}
