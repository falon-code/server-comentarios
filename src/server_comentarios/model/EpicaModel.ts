import { getGenericInventoryCollection, getInventoryMongoClient } from '../db/mongo';
import EpicaInterface from '../types/EpicaInterface';

export default class EpicaModel {
  private dbName: string;
  private readonly collectionName: string;
  private resolved = false;

  constructor() {
    this.dbName = process.env['INVENTORY_DB_NAME'] ?? 'Inventario';
    this.collectionName = process.env['INVENTORY_EPICAS_COLLECTION'] ?? 'epics';
  }

  // Autodetecta base de datos que contenga la colección de épicas si INVENTORY_DB_NAME no está definida
  private readonly ensureDbResolved = async (): Promise<void> => {
    if (this.resolved) return;
    if (process.env['INVENTORY_DB_NAME']) {
      this.resolved = true;
      return;
    }
    try {
      const client = await getInventoryMongoClient();
      const admin = client.db().admin();
      const { databases } = await admin.listDatabases();
      const names = databases.map(d => d.name);
      const candidates = ['comentarios', 'Inventario', 'NexusBattlesIV', 'test', 'local'];
      for (const c of candidates) {
        if (!names.includes(c)) continue;
        const cols = await client.db(c).listCollections().toArray();
        const hasCollection = cols.some(col => col.name === this.collectionName);
        if (hasCollection) {
          this.dbName = c;
          console.log(`[EpicaModel] Base de datos detectada: ${c}`);
          break;
        }
      }
    } catch (e) {
      console.warn(
        '[EpicaModel] No se pudo autodetectar DB, usando valor por defecto:',
        this.dbName,
        (e as Error).message
      );
    } finally {
      this.resolved = true;
    }
  };

  readonly getAll = async (filters?: {
    heroType?: string;
    status?: string | boolean;
    name?: string;
    effectType?: string;
  }): Promise<EpicaInterface[]> => {
    await this.ensureDbResolved();
    const col = await getGenericInventoryCollection<EpicaInterface>(this.dbName, this.collectionName);
    const query: Record<string, unknown> = {};
    if (filters?.heroType) query['heroType'] = filters.heroType;
    if (typeof filters?.status !== 'undefined')
      query['status'] = filters.status === 'true' || filters.status === true;
    if (filters?.name) query['name'] = { $regex: filters.name, $options: 'i' };
    if (filters?.effectType) query['effects.effectType'] = filters.effectType;
    const docs = await col.find(query).sort({ id: 1 }).toArray();
    console.log(`[EpicaModel] getAll query=${JSON.stringify(query)} returned=${docs.length}`);
    return docs;
  };

  readonly getById = async (id: number): Promise<EpicaInterface | null> => {
    await this.ensureDbResolved();
    const col = await getGenericInventoryCollection<EpicaInterface>(this.dbName, this.collectionName);
    return col.findOne({ id });
  };
}
