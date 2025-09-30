"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_1 = require("../db/mongo");
class ItemModel {
    dbName;
    collectionName;
    resolved = false;
    constructor() {
        // Valor inicial (puede cambiar si autodetección encuentra otra DB con la colección).
        this.dbName = process.env['INVENTORY_DB_NAME'] || 'Inventario';
        this.collectionName = process.env['INVENTORY_ITEMS_COLLECTION'] || 'items';
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
                const hasItems = cols.some(col => col.name === this.collectionName);
                if (hasItems) {
                    this.dbName = c;
                    console.log(`[ItemModel] Base de datos detectada: ${c}`);
                    break;
                }
            }
        }
        catch (e) {
            console.warn('[ItemModel] No se pudo autodetectar DB, usando valor por defecto:', this.dbName, e.message);
        }
        finally {
            this.resolved = true;
        }
    };
    getAll = async (filters) => {
        await this.ensureDbResolved();
        const col = await (0, mongo_1.getGenericInventoryCollection)(this.dbName, this.collectionName);
        const query = {};
        if (filters && typeof filters.heroType === 'string')
            query.heroType = filters.heroType;
        if (typeof filters?.status !== 'undefined')
            query.status = filters.status === 'true' || filters.status === true;
        if (filters && typeof filters.effectType === 'string')
            query['effects.effectType'] = filters.effectType; // items que tengan al menos un efecto con ese effectType
        // Name filter (case-insensitive, matches 'name' or 'nombre')
        if (filters && typeof filters.name === 'string' && filters.name.trim()) {
            const name = filters.name.trim();
            const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            // Match by english 'name' field
            query.name = re;
            const docs = await col.find(query).toArray();
            // Exact-match-first sort without losing stable order:
            const lower = name.toLowerCase();
            docs.sort((a, b) => {
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                const aExact = aName === lower ? 0 : 1;
                const bExact = bName === lower ? 0 : 1;
                if (aExact !== bExact)
                    return aExact - bExact; // exact matches (0) go first
                // then fallback to id ascending to keep deterministic order
                return (a.id ?? 0) - (b.id ?? 0);
            });
            console.log(`[ItemModel] getAll name='${name}' returned=${docs.length}`);
            return docs;
        }
        else {
            const docs = await col.find(query).sort({ id: 1 }).toArray();
            console.log(`[ItemModel] getAll query=${JSON.stringify(query)} returned=${docs.length}`);
            return docs;
        }
    };
    /*
      - Busca un documento cuyo campo lógico 'id' (numérico) coincida.
      - Retorna el documento o null si no existe.
    */
    getById = async (id) => {
        await this.ensureDbResolved();
        const col = await (0, mongo_1.getGenericInventoryCollection)(this.dbName, this.collectionName);
        return col.findOne({ id });
    };
}
exports.default = ItemModel;
