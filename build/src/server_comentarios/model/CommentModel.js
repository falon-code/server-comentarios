"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const mongo_1 = require("../db/mongo");
class CommentModel {
    // Inventario (para verificar referencias y obtener producto)
    inventoryDbName;
    inventoryResolved = false;
    constructor() {
        this.inventoryDbName = process.env['INVENTORY_DB_NAME'] || 'Inventario';
    }
    // Resuelve la base de datos de INVENTARIO en el cliente de inventario (URI aparte)
    ensureInventoryDbResolved = async () => {
        if (this.inventoryResolved)
            return;
        if (process.env['INVENTORY_DB_NAME']) {
            this.inventoryResolved = true;
            return;
        }
        try {
            const client = await (0, mongo_1.getInventoryMongoClient)();
            const admin = client.db().admin();
            const { databases } = await admin.listDatabases();
            const names = databases.map(d => d.name);
            const candidates = ['Inventario', 'NexusBattlesIV', 'comentarios', 'test', 'local'];
            for (const c of candidates) {
                if (!names.includes(c))
                    continue;
                const cols = await client.db(c).listCollections().toArray();
                const hasAny = cols.some(col => [
                    process.env['INVENTORY_ITEMS_COLLECTION'] || 'items',
                    process.env['INVENTORY_ARMORS_COLLECTION'] || 'armors',
                    process.env['INVENTORY_WEAPONS_COLLECTION'] || 'weapons',
                ].includes(col.name));
                if (hasAny) {
                    this.inventoryDbName = c;
                    console.log(`[CommentModel] DB de inventario detectada: ${c}`);
                    break;
                }
            }
        }
        catch (e) {
            console.warn('[CommentModel] No se pudo autodetectar DB de inventario, usando valor por defecto:', this.inventoryDbName, e.message);
        }
        finally {
            this.inventoryResolved = true;
        }
    };
    // Valida la estructura del comentario, normaliza fecha y ObjectId
    normalize(input) {
        if (!input || typeof input !== 'object')
            throw new Error('Payload inválido');
        const usuario = String(input.usuario || '').trim();
        const comentario = String(input.comentario || '').trim();
        const valoracion = Number(input.valoracion);
        const imagen = input.hasOwnProperty('imagen') ? (input.imagen === null ? null : String(input.imagen)) : undefined;
        const referencia = input.referencia || {};
        const tipo = referencia.tipo;
        const idRaw = referencia.id_objeto;
        if (!usuario || usuario.length < 3)
            throw new Error('usuario requerido (>=3 chars)');
        if (!comentario || comentario.length < 1)
            throw new Error('comentario requerido');
        if (!Number.isInteger(valoracion) || valoracion < 1 || valoracion > 5)
            throw new Error('valoracion 1..5 requerida');
        if (!tipo || !['armor', 'item', 'weapon'].includes(tipo))
            throw new Error('referencia.tipo inválido');
        let id_objeto;
        try {
            id_objeto = typeof idRaw === 'string' ? new mongodb_1.ObjectId(idRaw) : new mongodb_1.ObjectId(idRaw);
        }
        catch {
            throw new Error('referencia.id_objeto inválido');
        }
        const fecha = input.fecha ? new Date(input.fecha) : new Date();
        const base = { usuario, comentario, valoracion, fecha, referencia: { tipo, id_objeto } };
        if (imagen !== undefined)
            base.imagen = imagen;
        return base;
    }
    // Verifica que exista el documento referenciado en la colección correcta
    async verifyReferenceExists(tipo, id_objeto) {
        await this.ensureInventoryDbResolved();
        const map = {
            armor: process.env['INVENTORY_ARMORS_COLLECTION'] || 'armors',
            item: process.env['INVENTORY_ITEMS_COLLECTION'] || 'items',
            weapon: process.env['INVENTORY_WEAPONS_COLLECTION'] || 'weapons',
        };
        const col = await (0, mongo_1.getGenericInventoryCollection)(this.inventoryDbName, map[tipo]);
        const doc = await col.findOne({ _id: id_objeto });
        return !!doc;
    }
    // Crea un comentario. Opcionalmente podría imponer único por (usuario+tipo+id_objeto)
    create = async (payload) => {
        const col = await (0, mongo_1.getCommentsCollection)();
        const data = this.normalize(payload);
        const exists = await this.verifyReferenceExists(data.referencia.tipo, data.referencia.id_objeto);
        if (!exists)
            throw new Error('Recurso referenciado no existe');
        // Evitar duplicado por usuario+referencia (regla de negocio opcional)
        if (process.env['COMMENTS_UNIQUE_PER_USER'] === 'true') {
            const dup = await col.findOne({
                usuario: data.usuario,
                'referencia.tipo': data.referencia.tipo,
                'referencia.id_objeto': data.referencia.id_objeto,
            });
            if (dup)
                throw new Error('Ya existe un comentario del usuario para este recurso');
        }
        const res = await col.insertOne(data);
        return { ...data, _id: res.insertedId };
    };
    // Lista comentarios por referencia con filtros y ordenamiento
    listByReference = async (tipo, id_objeto, limit = 50, skip = 0, options) => {
        const col = await (0, mongo_1.getCommentsCollection)();
        let oid;
        try {
            oid = new mongodb_1.ObjectId(id_objeto);
        }
        catch {
            throw new Error('id_objeto inválido');
        }
        const query = { 'referencia.tipo': tipo, 'referencia.id_objeto': oid, eliminado: { $ne: true } };
        // Ordenamiento
        const orderBy = options?.orderBy === 'valoracion' ? 'valoracion' : 'fecha';
        const order = options?.order === 'asc' ? 1 : -1;
        const sort = { [orderBy]: order };
        return col.find(query).sort(sort).skip(skip).limit(limit).toArray();
    };
    // Obtiene resumen: info del producto, lista de comentarios (ordenada), y estadísticas de valoración
    getSummary = async (tipo, id_objeto, withProduct = true) => {
        await this.ensureInventoryDbResolved();
        const comments = await this.listByReference(tipo, id_objeto, 200, 0);
        const stats = comments.reduce((acc, c) => {
            acc.count += 1;
            acc.sum += Number(c.valoracion || 0);
            const k = String(c.valoracion || 0);
            acc.dist[k] = (acc.dist[k] || 0) + 1;
            return acc;
        }, { count: 0, sum: 0, dist: {} });
        const average = stats.count ? +(stats.sum / stats.count).toFixed(2) : 0;
        let product;
        if (withProduct) {
            const map = {
                armor: process.env['INVENTORY_ARMORS_COLLECTION'] || 'armors',
                item: process.env['INVENTORY_ITEMS_COLLECTION'] || 'items',
                weapon: process.env['INVENTORY_WEAPONS_COLLECTION'] || 'weapons',
            };
            const col = await (0, mongo_1.getGenericInventoryCollection)(this.inventoryDbName, map[tipo]);
            const oid = new mongodb_1.ObjectId(id_objeto);
            product = await col.findOne({ _id: oid });
        }
        return { product, comments, stats: { count: stats.count, average, distribution: stats.dist } };
    };
    // Obtiene un comentario por su _id (ObjectId)
    getById = async (_id) => {
        const col = await (0, mongo_1.getCommentsCollection)();
        const oid = new mongodb_1.ObjectId(_id);
        return col.findOne({ _id: oid });
    };
    // Eliminación lógica: marca eliminado=true y registra auditoría
    softDelete = async (_id, actor) => {
        const col = await (0, mongo_1.getCommentsCollection)();
        const oid = new mongodb_1.ObjectId(_id);
        const res = await col.updateOne({ _id: oid }, { $set: { eliminado: true, deletedAt: new Date(), deletedBy: actor } });
        return { ok: res.matchedCount > 0 && res.modifiedCount > 0 };
    };
    // Actualiza campos editables del comentario (sin permitir editar imagen)
    update = async (_id, updates, actor) => {
        // Validaciones en memoria; no requiere DB de inventario
        const set = { updatedAt: new Date(), updatedBy: actor };
        if (updates.hasOwnProperty('comentario')) {
            const c = (updates.comentario ?? '').toString().trim();
            if (!c)
                throw new Error('comentario requerido');
            set.comentario = c;
        }
        if (updates.hasOwnProperty('valoracion')) {
            const v = Number(updates.valoracion);
            if (!Number.isInteger(v) || v < 1 || v > 5)
                throw new Error('valoracion 1..5 requerida');
            set.valoracion = v;
        }
        const col = await (0, mongo_1.getCommentsCollection)();
        const oid = new mongodb_1.ObjectId(_id);
        const res = await col.updateOne({ _id: oid }, { $set: set });
        return { ok: res.matchedCount > 0 && res.modifiedCount >= 0 };
    };
    // Agrega una respuesta (un solo nivel de anidación) a un comentario existente
    addReply = async (_id, reply) => {
        const col = await (0, mongo_1.getCommentsCollection)();
        const oid = new mongodb_1.ObjectId(_id);
        const texto = (reply.comentario ?? '').toString().trim();
        if (!texto)
            throw new Error('La respuesta no puede estar vacía');
        const doc = await col.findOne({ _id: oid });
        if (!doc)
            throw new Error('Comentario no encontrado');
        if (doc.eliminado === true)
            throw new Error('No se puede responder a un comentario eliminado');
        // Evitar responder a respuestas: sólo se responde al comentario raíz
        const node = { usuario: reply.usuario, comentario: texto, fecha: reply.fecha ? new Date(reply.fecha) : new Date() };
        const res = await col.updateOne({ _id: oid }, { $push: { respuestas: node } });
        return { ok: res.matchedCount > 0 && res.modifiedCount > 0 };
    };
    // Dado un tipo y un id lógico (numérico), devuelve el ObjectId del producto
    resolveObjectIdByTipoAndLogicalId = async (tipo, id) => {
        await this.ensureInventoryDbResolved();
        const map = {
            armor: process.env['INVENTORY_ARMORS_COLLECTION'] || 'armors',
            item: process.env['INVENTORY_ITEMS_COLLECTION'] || 'items',
            weapon: process.env['INVENTORY_WEAPONS_COLLECTION'] || 'weapons',
        };
        const collectionName = map[tipo];
        const tryDbNames = [this.inventoryDbName];
        if (!process.env['INVENTORY_DB_NAME']) {
            // Añadir algunos candidatos comunes si no está fijado por env
            for (const c of ['Inventario', 'NexusBattlesIV', 'nexusbattles', 'comentarios', 'test', 'local']) {
                if (!tryDbNames.includes(c))
                    tryDbNames.push(c);
            }
        }
        let doc = null;
        for (const dbName of tryDbNames) {
            try {
                const col = await (0, mongo_1.getGenericInventoryCollection)(dbName, collectionName);
                doc = await col.findOne({ $or: [{ id }, { id: String(id) }] });
                if (doc?._id) {
                    this.inventoryDbName = dbName;
                    break;
                }
            }
            catch {
                // continuar con el siguiente candidato
            }
        }
        if (!doc?._id)
            throw new Error('Producto no encontrado por id lógico');
        return String(doc._id);
    };
}
exports.default = CommentModel;
