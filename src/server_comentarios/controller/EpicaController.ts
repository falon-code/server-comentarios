import { Request, Response } from 'express';
import EpicaModel from '../model/EpicaModel';

export default class EpicaController {
  constructor(private readonly epicaModel: EpicaModel) {}

  // GET /api/epicas
  readonly list = async (req: Request, res: Response): Promise<void> => {
    try {
      const q = req.query as Record<string, string | undefined>;
      const filters: { heroType?: string; status?: string; name?: string; effectType?: string } = {};
  if (q['heroType']) filters.heroType = q['heroType'];
  if (q['status']) filters.status = q['status'];
  if (q['name']) filters.name = q['name'];
  if (q['q'] && !filters.name) filters.name = q['q']; // alias búsqueda rápida
  if (q['effectType']) filters.effectType = q['effectType'];
      const docs = await this.epicaModel.getAll(filters);
      res.status(200).json(docs);
    } catch (e) {
      res.status(500).json({ message: 'Error al obtener epicas', error: (e as Error).message });
    }
  };

  // GET /api/epicas/:id
  readonly get = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt((req.params as { id: string }).id, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: 'ID inválido' });
        return;
      }
      const doc = await this.epicaModel.getById(id);
      if (!doc) {
        res.status(404).json({ message: 'Epica no encontrada' });
        return;
      }
      res.status(200).json(doc);
    } catch (e) {
      res.status(500).json({ message: 'Error al obtener epica', error: (e as Error).message });
    }
  };
}
