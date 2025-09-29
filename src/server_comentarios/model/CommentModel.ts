import { ObjectId } from 'mongodb';
import CommentInterface, { ReferenciaTipo } from "../types/CommentInterface";
import { getCommentsCollection, getInventoryMongoClient, getGenericInventoryCollection } from "../db/mongo";

export default class CommentModel {
  // Inventario (para verificar referencias y obtener producto)
  private inventoryDbName: string;
  private inventoryResolved = false;

  constructor() {
    this.inventoryDbName = process.env["INVENTORY_DB_NAME"] || "Inventario";
  }

  // Resuelve la base de datos de INVENTARIO en el cliente de inventario (URI aparte)
  private readonly ensureInventoryDbResolved = async (): Promise<void> => {
    if (this.inventoryResolved) return;
    if (process.env["INVENTORY_DB_NAME"]) { this.inventoryResolved = true; return; }
    try {
      const client = await getInventoryMongoClient();
      const admin = client.db().admin();
      const { databases } = await admin.listDatabases();
      const names = databases.map(d => d.name);
      const candidates = ["Inventario", "NexusBattlesIV", "comentarios", "test", "local"];
      for (const c of candidates) {
        if (!names.includes(c)) continue;
        const cols = await client.db(c).listCollections().toArray();
        const hasAny = cols.some(col => [
          process.env["INVENTORY_ITEMS_COLLECTION"] || 'items',
          process.env["INVENTORY_ARMORS_COLLECTION"] || 'armors',
          process.env["INVENTORY_WEAPONS_COLLECTION"] || 'weapons',
        ].includes(col.name));
        if (hasAny) {
          this.inventoryDbName = c;
          console.log(`[CommentModel] DB de inventario detectada: ${c}`);
          break;
        }
      }
    } catch (e) {
      console.warn('[CommentModel] No se pudo autodetectar DB de inventario, usando valor por defecto:', this.inventoryDbName, (e as Error).message);
    } finally {
      this.inventoryResolved = true;
    }
  }

  // Valida la estructura del comentario, normaliza fecha y ObjectId
  private normalize(input: any): CommentInterface {
    if (!input || typeof input !== 'object') throw new Error('Payload inválido');
    const usuario = String(input.usuario || '').trim();
    const comentario = String(input.comentario || '').trim();
    const valoracion = Number(input.valoracion);
    const imagen = (input.hasOwnProperty('imagen'))
      ? (input.imagen === null ? null : String(input.imagen))
      : undefined;
    const referencia = input.referencia || {};
    const tipo: ReferenciaTipo = referencia.tipo;
    const idRaw = referencia.id_objeto;
    if (!usuario || usuario.length < 3) throw new Error('usuario requerido (>=3 chars)');
    if (!comentario || comentario.length < 1) throw new Error('comentario requerido');
    if (!Number.isInteger(valoracion) || valoracion < 1 || valoracion > 5) throw new Error('valoracion 1..5 requerida');
    if (!tipo || !['armor','item','weapon'].includes(tipo)) throw new Error('referencia.tipo inválido');
    let id_objeto: ObjectId;
    try { id_objeto = typeof idRaw === 'string' ? new ObjectId(idRaw) : new ObjectId(idRaw); } catch { throw new Error('referencia.id_objeto inválido'); }
    const fecha = input.fecha ? new Date(input.fecha) : new Date();
    const base: CommentInterface = { usuario, comentario, valoracion, fecha, referencia: { tipo, id_objeto } };
    if (imagen !== undefined) base.imagen = imagen;
    return base;
  }

  // Verifica que exista el documento referenciado en la colección correcta
  private async verifyReferenceExists(tipo: ReferenciaTipo, id_objeto: ObjectId): Promise<boolean> {
    await this.ensureInventoryDbResolved();
    const map: Record<ReferenciaTipo, string> = {
      armor: process.env["INVENTORY_ARMORS_COLLECTION"] || 'armors',
      item: process.env["INVENTORY_ITEMS_COLLECTION"] || 'items',
      weapon: process.env["INVENTORY_WEAPONS_COLLECTION"] || 'weapons',
    };
    const col = await getGenericInventoryCollection<any>(this.inventoryDbName, map[tipo]);
    const doc = await col.findOne({ _id: id_objeto });
    return !!doc;
  }

  // Crea un comentario. Opcionalmente podría imponer único por (usuario+tipo+id_objeto)
  readonly create = async (payload: any): Promise<CommentInterface> => {
  const col = await getCommentsCollection<CommentInterface>();
    const data = this.normalize(payload);
    const exists = await this.verifyReferenceExists(data.referencia.tipo, data.referencia.id_objeto as ObjectId);
    if (!exists) throw new Error('Recurso referenciado no existe');

    // Evitar duplicado por usuario+referencia (regla de negocio opcional)
    if (process.env["COMMENTS_UNIQUE_PER_USER"] === 'true') {
      const dup = await col.findOne({
        usuario: data.usuario,
        'referencia.tipo': data.referencia.tipo,
        'referencia.id_objeto': data.referencia.id_objeto,
      });
      if (dup) throw new Error('Ya existe un comentario del usuario para este recurso');
    }

    const res = await col.insertOne(data as any);
    return { ...data, _id: res.insertedId };
  }

  // Lista comentarios por referencia con filtros y ordenamiento
  readonly listByReference = async (
    tipo: ReferenciaTipo,
    id_objeto: string,
    limit = 50,
    skip = 0,
    options?: {
      orderBy?: 'fecha' | 'valoracion';
      order?: 'asc' | 'desc';
    }
  ): Promise<CommentInterface[]> => {
  const col = await getCommentsCollection<CommentInterface>();
    let oid: ObjectId;
    try { oid = new ObjectId(id_objeto); } catch { throw new Error('id_objeto inválido'); }
    const query: any = { 'referencia.tipo': tipo, 'referencia.id_objeto': oid, eliminado: { $ne: true } };

    // Ordenamiento
    const orderBy = options?.orderBy === 'valoracion' ? 'valoracion' : 'fecha';
    const order = options?.order === 'asc' ? 1 : -1;
    const sort: any = { [orderBy]: order };

    return col.find(query)
             .sort(sort)
             .skip(skip)
             .limit(limit)
             .toArray();
  }

  // Obtiene resumen: info del producto, lista de comentarios (ordenada), y estadísticas de valoración
  readonly getSummary = async (tipo: ReferenciaTipo, id_objeto: string, withProduct = true): Promise<{ product?: any; comments: CommentInterface[]; stats: { count: number; average: number; distribution: Record<string, number> } }> => {
  await this.ensureInventoryDbResolved();
  const comments = await this.listByReference(tipo, id_objeto, 200, 0);
    const stats = comments.reduce((acc, c) => {
      acc.count += 1;
      acc.sum += Number(c.valoracion || 0);
      const k = String(c.valoracion || 0);
      acc.dist[k] = (acc.dist[k] || 0) + 1;
      return acc;
    }, { count: 0, sum: 0, dist: {} as Record<string, number> });
    const average = stats.count ? +(stats.sum / stats.count).toFixed(2) : 0;

    let product: any | undefined;
    if (withProduct) {
      const map: Record<ReferenciaTipo, string> = {
        armor: process.env["INVENTORY_ARMORS_COLLECTION"] || 'armors',
        item: process.env["INVENTORY_ITEMS_COLLECTION"] || 'items',
        weapon: process.env["INVENTORY_WEAPONS_COLLECTION"] || 'weapons',
      };
      const col = await getGenericInventoryCollection<any>(this.inventoryDbName, map[tipo]);
      const oid = new ObjectId(id_objeto);
      product = await col.findOne({ _id: oid });
    }

    return { product, comments, stats: { count: stats.count, average, distribution: stats.dist } };
  }

  // Obtiene un comentario por su _id (ObjectId)
  readonly getById = async (_id: string): Promise<CommentInterface | null> => {
    const col = await getCommentsCollection<CommentInterface>();
    const oid = new ObjectId(_id);
    return col.findOne({ _id: oid } as any);
  }

  // Eliminación lógica: marca eliminado=true y registra auditoría
  readonly softDelete = async (_id: string, actor: { user: string; role: 'player' | 'admin' }): Promise<{ ok: boolean } > => {
    const col = await getCommentsCollection<CommentInterface & any>();
    const oid = new ObjectId(_id);
    const res = await col.updateOne({ _id: oid }, { $set: { eliminado: true, deletedAt: new Date(), deletedBy: actor } });
    return { ok: res.matchedCount > 0 && res.modifiedCount > 0 };
  }

  // Actualiza campos editables del comentario (sin permitir editar imagen)
  readonly update = async (_id: string, updates: { comentario?: string; valoracion?: number }, actor: { user: string; role: 'player' | 'admin' }): Promise<{ ok: boolean } > => {
  // Validaciones en memoria; no requiere DB de inventario
    const set: any = { updatedAt: new Date(), updatedBy: actor };
    if (updates.hasOwnProperty('comentario')) {
      const c = (updates.comentario ?? '').toString().trim();
      if (!c) throw new Error('comentario requerido');
      set.comentario = c;
    }
    if (updates.hasOwnProperty('valoracion')) {
      const v = Number(updates.valoracion);
      if (!Number.isInteger(v) || v < 1 || v > 5) throw new Error('valoracion 1..5 requerida');
      set.valoracion = v;
    }
    const col = await getCommentsCollection<CommentInterface & any>();
    const oid = new ObjectId(_id);
    const res = await col.updateOne({ _id: oid }, { $set: set });
    return { ok: res.matchedCount > 0 && res.modifiedCount >= 0 };
  }

  // Agrega una respuesta (un solo nivel de anidación) a un comentario existente
  readonly addReply = async (_id: string, reply: { usuario: string; comentario: string; fecha?: Date }): Promise<{ ok: boolean }> => {
  const col = await getCommentsCollection<CommentInterface & any>();
    const oid = new ObjectId(_id);
    const texto = (reply.comentario ?? '').toString().trim();
    if (!texto) throw new Error('La respuesta no puede estar vacía');
    const doc = await col.findOne({ _id: oid } as any);
    if (!doc) throw new Error('Comentario no encontrado');
    if (doc.eliminado === true) throw new Error('No se puede responder a un comentario eliminado');
    // Evitar responder a respuestas: sólo se responde al comentario raíz
    const node = { usuario: reply.usuario, comentario: texto, fecha: reply.fecha ? new Date(reply.fecha) : new Date() };
  const res = await col.updateOne({ _id: oid } as any, { $push: { respuestas: node as any } } as any);
    return { ok: res.matchedCount > 0 && res.modifiedCount > 0 };
  }

  // Dado un tipo y un id lógico (numérico), devuelve el ObjectId del producto
  readonly resolveObjectIdByTipoAndLogicalId = async (tipo: ReferenciaTipo, id: number): Promise<string> => {
    await this.ensureInventoryDbResolved();
    const map: Record<ReferenciaTipo, string> = {
      armor: process.env["INVENTORY_ARMORS_COLLECTION"] || 'armors',
      item: process.env["INVENTORY_ITEMS_COLLECTION"] || 'items',
      weapon: process.env["INVENTORY_WEAPONS_COLLECTION"] || 'weapons',
    };
    const collectionName = map[tipo];
    const tryDbNames: string[] = [ this.inventoryDbName ];
    if (!process.env["INVENTORY_DB_NAME"]) {
      // Añadir algunos candidatos comunes si no está fijado por env
      for (const c of ["Inventario", "NexusBattlesIV", "nexusbattles", "comentarios", "test", "local"]) {
        if (!tryDbNames.includes(c)) tryDbNames.push(c);
      }
    }
    let doc: any = null;
    for (const dbName of tryDbNames) {
      try {
        const col = await getGenericInventoryCollection<any>(dbName, collectionName);
        doc = await col.findOne({ $or: [ { id }, { id: String(id) } ] as any });
        if (doc && doc._id) { this.inventoryDbName = dbName; break; }
      } catch {
        // continuar con el siguiente candidato
      }
    }
    if (!doc || !doc._id) throw new Error('Producto no encontrado por id lógico');
    return String(doc._id);
  }
}
