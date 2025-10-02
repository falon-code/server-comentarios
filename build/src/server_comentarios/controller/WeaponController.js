"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WeaponController {
    weaponModel;
    constructor(weaponModel) {
        this.weaponModel = weaponModel;
    }
    /*
      list (GET /api/weapons)
      Qué hace:
        - Lee query params opcionales: heroType, effectType, status.
        - Construye objeto filters SOLO con los que vienen definidos.
        - Llama weaponModel.getAll(filters).
        - Responde 200 con array (puede estar vacío).
      Errores:
        - 500 si ocurre algún problema consultando Mongo.
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
            const weapons = await this.weaponModel.getAll(filters);
            res.status(200).json(weapons);
        }
        catch (e) {
            const error = e;
            res.status(500).json({ message: 'Error al obtener weapons', error: error.message });
        }
    };
    /*
      get (GET /api/weapons/:id)
      Qué hace:
        - Lee :id de la ruta y lo convierte a number.
        - Si no es número válido -> 400.
        - Llama weaponModel.getById(id).
          * Si no lo encuentra -> 404.
          * Si lo encuentra -> 200 con el documento.
      Errores:
        - 500 si algo falla inesperadamente en la consulta.
    */
    get = async (req, res) => {
        try {
            const id = parseInt(req.params['id'], 10);
            if (isNaN(id)) {
                res.status(400).json({ message: 'ID inválido' });
                return;
            }
            const weapon = await this.weaponModel.getById(id);
            if (!weapon) {
                res.status(404).json({ message: 'Weapon no encontrada' });
                return;
            }
            res.status(200).json(weapon);
        }
        catch (e) {
            const error = e;
            res.status(500).json({ message: 'Error al obtener weapon', error: error.message });
        }
    };
}
exports.default = WeaponController;
