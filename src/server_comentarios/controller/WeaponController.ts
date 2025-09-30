import { Request, Response } from 'express';
import WeaponModel from '../model/WeaponModel';

export default class WeaponController {
  constructor(private readonly weaponModel: WeaponModel) {}

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
  readonly list = async (req: Request, res: Response): Promise<void> => {
    try {
      const q = req.query as Record<string, string | undefined>;
      const filters: { heroType?: string; effectType?: string; status?: string } = {};
      if (typeof q['heroType'] === 'string') filters.heroType = q['heroType'];
      if (typeof q['effectType'] === 'string') filters.effectType = q['effectType'];
      if (typeof q['status'] === 'string') filters.status = q['status'];

      const weapons = await this.weaponModel.getAll(filters);
      res.status(200).json(weapons);
    } catch (e: any) {
      res.status(500).json({ message: 'Error al obtener weapons', error: e.message });
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
  readonly get = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt((req.params as any)['id'], 10);
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
    } catch (e: any) {
      res.status(500).json({ message: 'Error al obtener weapon', error: e.message });
    }
  };
}
