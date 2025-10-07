import { getGenericInventoryCollection, getInventoryMongoClient } from '../db/mongo';
import ArmorInterface from '../types/ArmorInterface';

export default class ArmorModel {
  private dbName: string;
  private readonly collectionName: string;
  private resolved = false;

  constructor() {
    const rawDb = (process.env['INVENTORY_DB_NAME'] || '').trim();
    this.dbName = rawDb || 'Inventario'; // fallback si viene vacío
    const rawCol = (process.env['INVENTORY_ARMORS_COLLECTION'] || '').trim();
    this.collectionName = rawCol || 'armors';
    if (!this.collectionName) {
      console.warn('[ArmorModel] Nombre de colección vacío, usando fallback "armors"');
      (this as any).collectionName = 'armors';
    }
    console.log('[ArmorModel] init', { dbName: this.dbName, collection: this.collectionName });
  }

  /*
   * Este método se ejecuta una única vez para asegurar que la base de datos utilizada por el modelo de armaduras esté correctamente resuelta.
   * - Si el usuario ya definió la variable de entorno INVENTORY_DB_NAME, no realiza ninguna acción adicional.
   * - Si no está definida, lista todas las bases de datos disponibles y selecciona la primera de una lista de candidatos que contenga la colección de armaduras.
   * - Guarda el nombre de la base de datos seleccionada en `this.dbName` y marca la resolución como completada (`resolved = true`).
   */
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
        const hasArmors = cols.some(col => col.name === this.collectionName);
        if (hasArmors) {
          this.dbName = c;
          console.log(`[ArmorModel] Base de datos detectada: ${c}`);
          break;
        }
      }
    } catch (e) {
      console.warn(
        '[ArmorModel] No se pudo autodetectar DB, usando valor por defecto:',
        this.dbName,
        (e as Error).message
      );
    } finally {
      this.resolved = true;
    }
  };

  readonly getAll = async (filters?: {
    heroType?: string;
    armorType?: string;
    status?: string | boolean;
  }): Promise<ArmorInterface[]> => {
    await this.ensureDbResolved();
  if (!this.collectionName) throw new Error('Nombre de colección (armors) no definido');
  const col = await getGenericInventoryCollection<ArmorInterface>(this.dbName, this.collectionName);
    const query: Record<string, unknown> = {};
    if (filters && typeof filters['heroType'] === 'string') query['heroType'] = filters['heroType'];
    if (filters && typeof filters['armorType'] === 'string') query['armorType'] = filters['armorType'];
    if (typeof filters?.['status'] !== 'undefined')
      query['status'] = filters['status'] === 'true' || filters['status'] === true;
    const docs = await col.find(query).sort({ id: 1 }).toArray();
    console.log(`[ArmorModel] getAll query=${JSON.stringify(query)} returned=${docs.length}`);
    return docs;
  };

  readonly getById = async (id: number): Promise<ArmorInterface | null> => {
    await this.ensureDbResolved();
    const col = await getGenericInventoryCollection<ArmorInterface>(this.dbName, this.collectionName);
    return col.findOne({ id });
  };
}
