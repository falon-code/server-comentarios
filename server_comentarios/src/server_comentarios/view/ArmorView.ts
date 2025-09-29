import { Router } from 'express';
import ArmorController from '../controller/ArmorController';

export default class ArmorView {
  router: Router;
  constructor(private readonly armorController: ArmorController) {
    this.router = Router();
    this.routes();
  }

  readonly routes = (): void => {
    this.router.get('/armors', this.armorController.list); // filtrar todo
    this.router.get('/armors/:id', this.armorController.get); // detalle por id
  };
}