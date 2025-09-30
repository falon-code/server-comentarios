"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoClient = getMongoClient;
exports.getInventoryMongoClient = getInventoryMongoClient;
exports.getCommentsMongoClient = getCommentsMongoClient;
exports.getDb = getDb;
exports.getCommentsCollection = getCommentsCollection;
exports.getGenericCollection = getGenericCollection;
exports.getGenericInventoryCollection = getGenericInventoryCollection;
exports.ensureIndexes = ensureIndexes;
exports.pingMongo = pingMongo;
exports.closeMongo = closeMongo;
const mongodb_1 = require("mongodb");
// Estas variables guardan estado de la conexión.
let clientPromise = null;
let clientInstance = null;
let loggedConnection = false;
// Cliente separado para INVENTARIO (posible URI diferente)
let inventoryClientPromise = null;
let inventoryClientInstance = null;
let loggedInventoryConnection = false;
// Cliente separado para COMENTARIOS (posible URI diferente)
let commentsClientPromise = null;
let commentsClientInstance = null;
let loggedCommentsConnection = false;
// Configuración base (con defaults).
const uri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017';
const dbName = process.env['MONGODB_DB'] || 'NexusBattlesIV';
const collectionName = process.env['MONGODB_COLLECTION'] || 'comentarios';
// Permite definir una base específica para los comentarios
const commentsDbName = process.env['MONGODB_DB_COMMENTS'] || dbName;
let detectedCommentsDbName = null;
let commentsDbResolved = false;
// URI alterna para inventario (si no se define, reutiliza la principal)
const inventoryUri = process.env['MONGODB_URI_INVENTORY'] || process.env['MONGODB_URI'] || 'mongodb://localhost:27017';
const commentsUri = process.env['MONGODB_URI_COMMENTS'] || process.env['MONGODB_URI'] || 'mongodb://localhost:27017';
/**
 * - Si ya hay una instancia conectada la devuelve.
 * - Si no existe, crea una sola promesa de conexión para evitar carreras.
 * - Loguea una sola vez el mensaje de conexión.
 * - Si falla la conexión inicial, limpia clientPromise para permitir reintento después.
 */
async function getMongoClient() {
    if (clientInstance)
        return clientInstance;
    if (!clientPromise) {
        const client = new mongodb_1.MongoClient(uri);
        clientPromise = client
            .connect()
            .then(c => {
            clientInstance = c;
            if (!loggedConnection) {
                console.log(`[Mongo] Conectado a ${uri} / DB: ${dbName}`);
                loggedConnection = true;
            }
            return c;
        })
            .catch(err => {
            console.error('[Mongo] Error de conexión inicial:', err);
            clientPromise = null; // permitir reintentos
            throw err;
        });
    }
    return clientPromise;
}
/**
 * - Cliente para el clúster/base de INVENTARIO (puede usar un URI diferente).
 * - Mantiene su propio singleton para permitir dos conexiones en paralelo.
 */
async function getInventoryMongoClient() {
    if (inventoryClientInstance)
        return inventoryClientInstance;
    if (!inventoryClientPromise) {
        const client = new mongodb_1.MongoClient(inventoryUri);
        inventoryClientPromise = client
            .connect()
            .then(c => {
            inventoryClientInstance = c;
            if (!loggedInventoryConnection) {
                console.log(`[Mongo][Inventory] Conectado a ${inventoryUri}`);
                loggedInventoryConnection = true;
            }
            return c;
        })
            .catch(err => {
            console.error('[Mongo][Inventory] Error de conexión inicial:', err);
            inventoryClientPromise = null;
            throw err;
        });
    }
    return inventoryClientPromise;
}
/**
 * - Cliente para el clúster/base de COMENTARIOS (puede usar un URI diferente).
 * - Mantiene su propio singleton.
 */
async function getCommentsMongoClient() {
    if (commentsClientInstance)
        return commentsClientInstance;
    if (!commentsClientPromise) {
        const client = new mongodb_1.MongoClient(commentsUri);
        commentsClientPromise = client
            .connect()
            .then(c => {
            commentsClientInstance = c;
            if (!loggedCommentsConnection) {
                console.log(`[Mongo][Comments] Conectado a ${commentsUri} / DB: ${commentsDbName}`);
                loggedCommentsConnection = true;
            }
            return c;
        })
            .catch(err => {
            console.error('[Mongo][Comments] Error de conexión inicial:', err);
            commentsClientPromise = null;
            throw err;
        });
    }
    return commentsClientPromise;
}
/**
 * - Devuelve el objeto Db para dbName (usa el cliente singleton).
 */
async function getDb() {
    const client = await getCommentsMongoClient();
    return client.db(dbName);
}
/**
 * - Retorna la colección definida en collectionName (por defecto 'comentarios').
 * - Queda como legado por si se reintroduce módulo de comentarios.
 */
async function getCommentsDb() {
    const client = await getCommentsMongoClient();
    // Si el usuario fijó explícitamente la DB de comentarios, úsala.
    if (process.env['MONGODB_DB_COMMENTS']) {
        return client.db(commentsDbName);
    }
    // Intentar autodetección una sola vez (por colección de comentarios)
    if (!commentsDbResolved) {
        try {
            const admin = client.db().admin();
            const { databases } = await admin.listDatabases();
            for (const d of databases) {
                try {
                    const cols = await client.db(d.name).listCollections().toArray();
                    if (cols.some(c => c.name === collectionName)) {
                        detectedCommentsDbName = d.name;
                        console.log(`[Mongo][Comments] DB detectada: ${detectedCommentsDbName}`);
                        break;
                    }
                }
                catch {
                    /* ignore dbs without permission */
                }
            }
        }
        catch (e) {
            console.warn('[Mongo][Comments] No se pudo autodetectar DB, uso fallback:', commentsDbName, e.message);
        }
        finally {
            commentsDbResolved = true;
        }
    }
    return client.db(detectedCommentsDbName || commentsDbName);
}
async function getCommentsCollection() {
    const db = await getCommentsDb();
    return db.collection(collectionName);
}
/**
 * - Sirve para acceder a cualquier base y colección (ej: autodetección en modelos de inventario).
 * - No crea nuevas conexiones, reutiliza el cliente existente.
 */
async function getGenericCollection(dbTarget, collection) {
    const client = await getMongoClient();
    return client.db(dbTarget).collection(collection);
}
/**
 * - Versión para INVENTARIO: permite acceder a cualquier base/colección sobre el cliente de inventario.
 */
async function getGenericInventoryCollection(dbTarget, collection) {
    const client = await getInventoryMongoClient();
    return client.db(dbTarget).collection(collection);
}
// Flag para evitar recrear índices cada vez.
let indexesEnsured = false;
/**
 * - Crea índices básicos sobre la colección de comentarios (si se está usando).
 * - Se ejecuta solo una vez por proceso.
 * - Si algún índice falla, lo registra y continúa.
 */
async function ensureIndexes() {
    if (indexesEnsured)
        return;
    const col = await getCommentsCollection();
    await Promise.all([
        col.createIndex({ productoId: 1, eliminado: 1, id: 1 }),
        col.createIndex({ id: 1 }, { unique: true }),
        col.createIndex({ tipoProducto: 1, productoId: 1, eliminado: 1, fecha: -1 }),
    ]).catch(err => console.error('Error creando índices comentarios:', err));
    indexesEnsured = true;
}
/**
 * - Ejecuta comando ping para comprobar que el servidor Mongo responde.
 * - Devuelve objeto simple con ok:true o ok:false + error.
 * - Útil para un endpoint /health.
 */
async function pingMongo() {
    try {
        const db = await getDb();
        await db.command({ ping: 1 });
        return { ok: true };
    }
    catch (e) {
        return { ok: false, error: e?.message || 'unknown error' };
    }
}
/**
 * - Cierra la conexión y limpia referencias para permitir reconectar después.
 * - Usar típicamente en tests o al apagar el servidor de forma controlada.
 */
async function closeMongo() {
    if (clientInstance) {
        await clientInstance.close();
        clientInstance = null;
        clientPromise = null;
        indexesEnsured = false;
    }
    if (inventoryClientInstance) {
        await inventoryClientInstance.close();
        inventoryClientInstance = null;
        inventoryClientPromise = null;
    }
    if (commentsClientInstance) {
        await commentsClientInstance.close();
        commentsClientInstance = null;
        commentsClientPromise = null;
    }
}
