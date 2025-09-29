import { Request, Response } from 'express';
import ArmorModel from '../model/ArmorModel';

export default class ArmorController {
  constructor(private readonly armorModel: ArmorModel) {}

  /*
    list (GET /api/armors)
    - Lee query params: heroType, armorType, status (todos opcionales).
    - Construye un objeto filters y se lo pasa al modelo.
    - Devuelve: 200 con array (puede venir vacío) o 500 si algo falla.
  */
  readonly list = async (req: Request, res: Response): Promise<void> => {
    try {
      const q = req.query as Record<string, string | undefined>;
      const filters: { heroType?: string; armorType?: string; status?: string } = {};
      if (typeof q['heroType'] === 'string') filters.heroType = q['heroType'];
      if (typeof q['armorType'] === 'string') filters.armorType = q['armorType'];
      if (typeof q['status'] === 'string') filters.status = q['status'];
      const armors = await this.armorModel.getAll(filters);
      res.status(200).json(armors);
    } catch (e) {
      res.status(500).json({ message: 'Error al obtener armors', error: (e as Error).message });
    }
  };

  /*
    get (GET /api/armors/:id)
    - Toma el parámetro :id, lo convierte a number.
    - Si id no es numérico -> 400.
    - Pide al modelo getById(id).
      * Si no existe -> 404.
      * Si existe -> 200 con el documento.
    - Si ocurre un error inesperado -> 500.
  */
  readonly get = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt((req.params as any)['id'], 10);
      if (isNaN(id)) { res.status(400).json({ message: 'ID inválido' }); return; }
      const armor = await this.armorModel.getById(id);
      if (!armor) { res.status(404).json({ message: 'Armor no encontrado' }); return; }
      res.status(200).json(armor);
    } catch (e) {
      res.status(500).json({ message: 'Error al obtener armor', error: (e as Error).message });
    }
  };
}