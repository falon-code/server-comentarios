import { Router } from 'express';
import ItemController from '../controller/ItemController';

export default class ItemView {
  router: Router;
  constructor(private readonly itemController: ItemController) {
    this.router = Router();
    this.routes();
  }
  readonly routes = () => {
    this.router.get('/items', this.itemController.list); // filtrar todo
    this.router.get('/items/:id', this.itemController.get); // detalle por id
  };
}