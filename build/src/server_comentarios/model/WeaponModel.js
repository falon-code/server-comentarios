"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_1 = require("../db/mongo");
class WeaponModel {
    dbName;
    collectionName;
    resolved = false;
    constructor() {
        const rawDb = (process.env['INVENTORY_DB_NAME'] || '').trim();
        this.dbName = rawDb || 'Inventario';
        const rawCol = (process.env['INVENTORY_WEAPONS_COLLECTION'] || '').trim();
        this.collectionName = rawCol || 'weapons';
        if (!this.collectionName) {
            console.warn('[WeaponModel] Nombre de colección vacío, usando fallback "weapons"');
            this.collectionName = 'weapons';
        }
        console.log('[WeaponModel] init', { dbName: this.dbName, collection: this.collectionName });
    }
    /*
     * Este método se ejecuta una única vez para asegurar que la base de datos utilizada por el modelo de armaduras esté correctamente resuelta.
     * - Si el usuario ya definió la variable de entorno INVENTORY_DB_NAME, no realiza ninguna acción adicional.
     * - Si no está definida, lista todas las bases de datos disponibles y selecciona la primera de una lista de candidatos que contenga la colección de armaduras.
     * - Guarda el nombre de la base de datos seleccionada en `this.dbName` y marca la resolución como completada (`resolved = true`).
     */
    ensureDbResolved = async () => {
        if (this.resolved)
            return;
        if (process.env['INVENTORY_DB_NAME']) {
            this.resolved = true;
            return;
        }
        try {
            const client = await (0, mongo_1.getInventoryMongoClient)();
            const admin = client.db().admin();
            const { databases } = await admin.listDatabases();
            const names = databases.map(d => d.name);
            const candidates = ['comentarios', 'Inventario', 'NexusBattlesIV', 'test', 'local'];
            for (const c of candidates) {
                if (!names.includes(c))
                    continue;
                const cols = await client.db(c).listCollections().toArray();
                const hasWeapons = cols.some(col => col.name === this.collectionName);
                if (hasWeapons) {
                    this.dbName = c;
                    console.log(`[WeaponModel] Base de datos detectada: ${c}`);
                    break;
                }
            }
        }
        catch (e) {
            console.warn('[WeaponModel] No se pudo autodetectar DB, usando valor por defecto:', this.dbName, e.message);
        }
        finally {
            this.resolved = true;
        }
    };
    /*
      getAll:
      - Obtiene todas las armas aplicando filtros opcionales.
      - Ordena los resultados por id ascendente.
      - Devuelve un array de WeaponInterface (puede estar vacío).
    */
    getAll = async (filters) => {
        await this.ensureDbResolved();
        if (!this.collectionName)
            throw new Error('Nombre de colección (weapons) no definido');
        const col = await (0, mongo_1.getGenericInventoryCollection)(this.dbName, this.collectionName);
        const query = {};
        if (filters && typeof filters['heroType'] === 'string')
            query['heroType'] = filters['heroType'];
        if (typeof filters?.['status'] !== 'undefined')
            query['status'] = filters['status'] === 'true' || filters['status'] === true;
        if (filters && typeof filters.effectType === 'string')
            query['effects.effectType'] = filters.effectType;
        const docs = await col.find(query).sort({ id: 1 }).toArray();
        console.log(`[WeaponModel] getAll query=${JSON.stringify(query)} returned=${docs.length}`);
        return docs;
    };
    /*
      - Busca un documento por su campo lógico 'id'.
      - Retorna el documento o null si no existe.
    */
    getById = async (id) => {
        await this.ensureDbResolved();
        const col = await (0, mongo_1.getGenericInventoryCollection)(this.dbName, this.collectionName);
        return col.findOne({ id });
    };
}
exports.default = WeaponModel;
