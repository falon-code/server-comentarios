"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ItemController {
    itemModel;
    constructor(itemModel) {
        this.itemModel = itemModel;
    }
    /*
      list (GET /api/items)
      Qué hace:
        - Lee query params opcionales: heroType, effectType, status.
        - Construye un objeto filters solo con los que llegan.
        - Llama itemModel.getAll(filters) para traer los documentos.
        - Devuelve 200 con un array (aunque esté vacío).
  
      Errores:
        - 500 si algo truena en la capa de datos.
    */
    list = async (req, res) => {
        try {
            const q = req.query;
            const filters = {};
            if (typeof q['heroType'] === 'string')
                filters.heroType = q['heroType'];
            if (typeof q['effectType'] === 'string')
                filters.effectType = q['effectType'];
            if (typeof q['status'] === 'string')
                filters.status = q['status'];
            if (typeof q['name'] === 'string')
                filters.name = q['name'];
            if (typeof q['q'] === 'string' && !filters.name)
                filters.name = q['q'];
            const items = await this.itemModel.getAll(filters);
            res.status(200).json(items);
        }
        catch (e) {
            res.status(500).json({ message: 'Error al obtener items', error: e.message });
        }
    };
    /*
      get (GET /api/items/:id)
      Qué hace:
        - Toma req.params.id y lo convierte a number.
        - Valida que sea un número (si no, 400).
        - Llama itemModel.getById(id).
          * Si no existe -> 404.
          * Si existe -> 200 y el item.
      Errores:
        - 500 si ocurre un error inesperado.
    */
    get = async (req, res) => {
        try {
            const id = parseInt(req.params['id'], 10);
            if (isNaN(id)) {
                res.status(400).json({ message: 'ID inválido' });
                return;
            }
            const item = await this.itemModel.getById(id);
            if (!item) {
                res.status(404).json({ message: 'Item no encontrado' });
                return;
            }
            res.status(200).json(item);
        }
        catch (e) {
            res.status(500).json({ message: 'Error al obtener item', error: e.message });
        }
    };
}
exports.default = ItemController;
