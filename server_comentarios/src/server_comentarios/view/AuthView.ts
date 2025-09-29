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
    // Login: usa x-user / x-pass y devuelve token Bearer
    this.router.post('/login', loginHandler, this.controller.login);
  }
}
