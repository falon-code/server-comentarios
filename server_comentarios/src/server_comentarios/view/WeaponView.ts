import { Router } from 'express';
import WeaponController from '../controller/WeaponController';

export default class WeaponView {
  router: Router;
  constructor(private readonly weaponController: WeaponController) {
    this.router = Router();
    this.routes();
  }
  readonly routes = () => {
    this.router.get('/weapons', this.weaponController.list); // filtrar todo
    this.router.get('/weapons/:id', this.weaponController.get); // detalle por id
  };
}