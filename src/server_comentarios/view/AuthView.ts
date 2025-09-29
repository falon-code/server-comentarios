import { Router } from 'express';
import AuthController from "../controller/AuthController";
import { loginHandler } from "../middleware/auth";

export default class AuthView {
  public readonly router: Router;
  constructor(private readonly controller: AuthController) {
    this.router = Router();
    this.routes();
  }
  private routes() {
    /**
     * @swagger
     * /login:
     *   post:
     *     tags: [Auth]
     *     summary: Iniciar sesión
     *     description: Autentica un usuario y devuelve un token Bearer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginCredentials'
     *         application/x-www-form-urlencoded:
     *           schema:
     *             $ref: '#/components/schemas/LoginCredentials'
     *     responses:
     *       200:
     *         description: Login exitoso
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       401:
     *         description: Credenciales inválidas
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       400:
     *         description: Datos de entrada inválidos
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
    // Login: usa x-user / x-pass y devuelve token Bearer
    this.router.post('/login', loginHandler, this.controller.login);
  }
}
