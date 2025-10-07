import { Request, Response } from 'express';
import CommentModel from "../model/CommentModel";

export default class CommentController {
  constructor(private readonly model: CommentModel) {}

  // Helper interno para validar / normalizar imagen opcional
  private processIncomingImage(raw: any): string | null | undefined {
    if (raw === undefined) return undefined;
    if (raw === null) return null; // Permite null explícito
    const img: string = String(raw ?? '').trim();
    if (!img) return undefined;
    const maxLen = Number(process.env["COMMENT_IMAGE_MAX_LENGTH"] || 300000); // default ~300KB
    if (img.length > maxLen) throw new Error(`La imagen excede el tamaño máximo permitido (${maxLen} chars)`);
    // Sólo permitir png, jpg/jpeg y webp (excluir gif)
    const isDataUrl = /^data:image\/(png|jpe?g|webp);base64,/i.test(img);
    const isHttp = /^https?:\/\//i.test(img);
    if (!isDataUrl && !isHttp) throw new Error('Formato de imagen no soportado. Use data:image/(png|jpg|jpeg|webp);base64 ó URL http(s)');
    // Validación extra para URLs http(s): verificar extensión simple si no es data URL
    if (isHttp) {
      const src: string = img; // ya es string no undefined
      if (!src) throw new Error('URL de imagen vacía');
      const cleaned = src.toLowerCase().replace(/[?#].*$/, '');
      if (!/(\.png|\.jpe?g|\.webp)$/.test(cleaned)) {
        throw new Error('Sólo se permiten URLs con extensión .png, .jpg, .jpeg o .webp');
      }
    }
    if (isDataUrl) {
      const commaIdx = img.indexOf(',');
      const b64 = img.substring(commaIdx + 1);
      try { Buffer.from(b64, 'base64'); } catch { throw new Error('Base64 inválido en data URL'); }
    }
    return img;
  }

  // POST /api/comments  (auth requerido)
  readonly create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body || {};
      // Sobrescribir usuario desde auth si viene
      const auth = (req as any).auth;
      if (auth?.user) body.usuario = auth.user;
      // Validar/normalizar imagen (opcional)
      if (Object.prototype.hasOwnProperty.call(body, 'imagen')) {
        try {
          body.imagen = this.processIncomingImage(body.imagen);
        } catch (imgErr: any) {
          res.status(400).json({ message: 'Imagen inválida', error: imgErr?.message || String(imgErr) });
          return;
        }
      }
      const doc = await this.model.create(body);
      res.status(201).json(doc);
    } catch (e: any) {
      const msg = e?.message || 'Error creando comentario';
      const code = /recurso referenciado/i.test(msg) || /inválid/i.test(msg) ? 400 : 500;
      res.status(code).json({ message: 'No se pudo crear comentario', error: msg });
    }
  }

  // POST /api/:tipo/:idOrOid/comments  (auth requerido)
  // Crea comentario asociado al recurso de la ruta, tomando usuario del auth/body
  readonly createByPath = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tipo, idOrOid } = req.params as Record<string,string>;
      if (!tipo || !idOrOid) { res.status(400).json({ message: 'tipo e id son requeridos' }); return; }
      const isNumericId = /^\d+$/.test(idOrOid);
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
      if (!isNumericId && !isObjectId) { res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' }); return; }
      const oid = isObjectId
        ? idOrOid
        : await this.model.resolveObjectIdByTipoAndLogicalId(tipo as any, Number(idOrOid));
      const auth = (req as any).auth as { user: string; role: 'player' | 'admin' } | undefined;
      const usuario = (auth?.user || req.body?.usuario || '').toString().trim();
      if (!usuario) { res.status(400).json({ message: 'usuario requerido' }); return; }
      const comentario = (req.body?.comentario ?? '').toString();
      const valoracionRaw = req.body?.valoracion;
      const valoracion = typeof valoracionRaw === 'undefined' ? undefined : Number(valoracionRaw);
      const payload: any = { usuario, comentario };
      if (typeof valoracion !== 'undefined' && !Number.isNaN(valoracion)) payload.valoracion = valoracion;
      // Imagen opcional
      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'imagen')) {
        try {
          payload.imagen = this.processIncomingImage((req.body as any).imagen);
        } catch (imgErr: any) {
          res.status(400).json({ message: 'Imagen inválida', error: imgErr?.message || String(imgErr) });
          return;
        }
      }
      payload.referencia = { tipo: tipo as any, id_objeto: oid };
      const doc = await this.model.create(payload);
      res.status(201).json(doc);
    } catch (e: any) {
      const msg = e?.message || 'Error creando comentario';
      const code = /inválid|requerid|encontrado/i.test(msg) ? 400 : 500;
      res.status(code).json({ message: 'No se pudo crear comentario', error: msg });
    }
  }

  // GET /api/comments/:tipo/:idOrOid
  // Devuelve resumen: producto + comentarios + estadísticas
  readonly summaryByPath = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tipo, idOrOid } = req.params as Record<string,string>;
      if (!tipo || !idOrOid) { res.status(400).json({ message: 'tipo e id son requeridos' }); return; }
      const isNumericId = /^\d+$/.test(idOrOid);
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
      if (!isNumericId && !isObjectId) { res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' }); return; }
      const oid = isObjectId
        ? idOrOid
        : await this.model.resolveObjectIdByTipoAndLogicalId(tipo as any, Number(idOrOid));
      const data = await this.model.getSummary(tipo as any, oid, true);
      res.status(200).json(data);
    } catch (e: any) {
      const msg = e?.message || 'Error obteniendo resumen';
      const code = /inválid|no encontrado/i.test(msg) ? 400 : 500;
      res.status(code).json({ message: 'No se pudo obtener resumen', error: msg });
    }
  }

  // GET /api/:tipo/:idOrOid/comments
  // Devuelve SOLO los comentarios (sin product ni stats)
  readonly listByPath = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tipo, idOrOid } = req.params as Record<string,string>;
      const { limit, skip, orderBy, order } = (req.query || {}) as Record<string, string>;
      if (!tipo || !idOrOid) { res.status(400).json({ message: 'tipo e id son requeridos' }); return; }
      const isNumericId = /^\d+$/.test(idOrOid);
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
      if (!isNumericId && !isObjectId) { res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' }); return; }
      const oid = isObjectId
        ? idOrOid
        : await this.model.resolveObjectIdByTipoAndLogicalId(tipo as any, Number(idOrOid));
      const lim = Math.max(1, Math.min(100, Number(limit || 50)));
      const sk = Math.max(0, Number(skip || 0));
      const opts: any = {
        orderBy: orderBy === 'valoracion' ? 'valoracion' : 'fecha',
        order: order === 'asc' ? 'asc' : 'desc',
      };
      const comments = await this.model.listByReference(
        tipo as any,
        oid,
        lim,
        sk,
        opts
      );
      res.status(200).json(comments);
    } catch (e: any) {
      const msg = e?.message || 'Error listando comentarios';
      const code = /inválid|no encontrado/i.test(msg) ? 400 : 500;
      res.status(code).json({ message: 'No se pudo listar comentarios', error: msg });
    }
  }
    // PUT /api/:tipo/:idOrOid/comments/:commentId  (admin requerido)
    // Edita comentario: solo texto y valoracion (no imagen)
    readonly updateByPath = async (req: Request, res: Response): Promise<void> => {
      try {
        const { tipo, idOrOid, commentId } = req.params as Record<string,string>;
        if (!tipo || !idOrOid || !commentId) { res.status(400).json({ message: 'tipo, id y commentId son requeridos' }); return; }
        // Auth admin
        const auth = (req as any).auth as { user: string; role: 'player' | 'admin' } | undefined;
        if (!auth) { res.status(401).json({ message: 'No autenticado' }); return; }
        if (auth.role !== 'admin') { res.status(403).json({ message: 'Solo administrador puede editar comentarios' }); return; }

        // Resolver ObjectId del recurso
        const isNumericId = /^\d+$/.test(idOrOid);
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
        if (!isNumericId && !isObjectId) { res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' }); return; }
        const oid = isObjectId
          ? idOrOid
          : await this.model.resolveObjectIdByTipoAndLogicalId(tipo as any, Number(idOrOid));

        // Cargar comentario y validar
        if (!/^[a-fA-F0-9]{24}$/.test(commentId)) { res.status(400).json({ message: 'commentId inválido' }); return; }
        const comment = await this.model.getById(commentId);
        if (!comment) { res.status(404).json({ message: 'Comentario no encontrado' }); return; }
        const belongs = comment.referencia?.tipo === (tipo as any)
          && String(comment.referencia?.id_objeto) === String(oid);
        if (!belongs) { res.status(400).json({ message: 'El comentario no corresponde al recurso indicado' }); return; }
        if ((comment as any).eliminado === true) { res.status(400).json({ message: 'No se puede editar un comentario eliminado' }); return; }

        // Validar payload: al menos uno de los campos permitidos
        const { comentario, valoracion } = req.body || {};
        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'imagen')) {
          res.status(400).json({ message: 'No está permitido editar la imagen del comentario' }); return;
        }
        if (
          (typeof comentario === 'undefined') &&
          (typeof valoracion === 'undefined')
        ) { res.status(400).json({ message: 'Debe enviar al menos un campo: comentario o valoracion' }); return; }

        const result = await this.model.update(commentId, { comentario, valoracion }, auth);
        if (!result.ok) { res.status(500).json({ message: 'No se pudo actualizar el comentario' }); return; }
        res.status(200).json({ ok: true, id: commentId });
      } catch (e: any) {
        const msg = e?.message || 'Error editando comentario';
        const code = /inválid|no encontrado|requerid/i.test(msg) ? 400 : 500;
        res.status(code).json({ message: 'No se pudo editar comentario', error: msg });
      }
    }

    // DELETE /api/:tipo/:idOrOid/comments/:commentId  (auth requerido)
    // Elimina un comentario asociado al recurso indicado por la ruta
    readonly removeByPath = async (req: Request, res: Response): Promise<void> => {
      try {
        const { tipo, idOrOid, commentId } = req.params as Record<string,string>;
        if (!tipo || !idOrOid || !commentId) { res.status(400).json({ message: 'tipo, id y commentId son requeridos' }); return; }
        // Confirmación
        // Confirmación opcional: por compatibilidad, si no se envía, asumimos true
        const q: any = req.query || {};
        const confirmRaw = String((q['confirm'] ?? 'true') as string).toLowerCase();
        if (!(confirmRaw === 'true' || confirmRaw === '1' || confirmRaw === 'yes')) {
          res.status(400).json({ message: 'Confirmación requerida: agregue ?confirm=true', requiresConfirmation: true });
          return;
        }
        // Resolver ObjectId del recurso
        const isNumericId = /^\d+$/.test(idOrOid);
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
        if (!isNumericId && !isObjectId) { res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' }); return; }
        const oid = isObjectId
          ? idOrOid
          : await this.model.resolveObjectIdByTipoAndLogicalId(tipo as any, Number(idOrOid));

        // Auth
        const auth = (req as any).auth as { user: string; role: 'player' | 'admin' } | undefined;
        if (!auth) { res.status(401).json({ message: 'No autenticado' }); return; }

        // Cargar comentario y validar que pertenece a este recurso
        if (!/^[a-fA-F0-9]{24}$/.test(commentId)) { res.status(400).json({ message: 'commentId inválido' }); return; }
        const comment = await this.model.getById(commentId);
        if (!comment) { res.status(404).json({ message: 'Comentario no encontrado' }); return; }
        const belongs = comment.referencia?.tipo === (tipo as any)
          && String(comment.referencia?.id_objeto) === String(oid);
        if (!belongs) { res.status(400).json({ message: 'El comentario no corresponde al recurso indicado' }); return; }

        // Autorización
        if (auth.role !== 'admin' && comment.usuario !== auth.user) { res.status(403).json({ message: 'No autorizado a eliminar este comentario' }); return; }

        const result = await this.model.softDelete(commentId, auth);
        if (!result.ok) { res.status(500).json({ message: 'No se pudo eliminar' }); return; }
        res.status(200).json({ ok: true, id: commentId, eliminado: true });
      } catch (e: any) {
        const msg = e?.message || 'Error eliminando comentario';
        const code = /inválid|no encontrado/i.test(msg) ? 400 : 500;
        res.status(code).json({ message: 'No se pudo eliminar comentario', error: msg });
      }
    }

    // POST /api/:tipo/:idOrOid/comments/:commentId/replies  (auth requerido)
    // Agrega una respuesta (un nivel) al comentario indicado
    readonly replyByPath = async (req: Request, res: Response): Promise<void> => {
      try {
        const { tipo, idOrOid, commentId } = req.params as Record<string,string>;
        if (!tipo || !idOrOid || !commentId) { res.status(400).json({ message: 'tipo, id y commentId son requeridos' }); return; }
        // Auth: admin o player
        const auth = (req as any).auth as { user: string; role: 'player' | 'admin' } | undefined;
        if (!auth) { res.status(401).json({ message: 'No autenticado' }); return; }

        // Resolver recurso
        const isNumericId = /^\d+$/.test(idOrOid);
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
        if (!isNumericId && !isObjectId) { res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' }); return; }
        const oid = isObjectId
          ? idOrOid
          : await this.model.resolveObjectIdByTipoAndLogicalId(tipo as any, Number(idOrOid));

        // Validar commentId y pertenencia
        if (!/^[a-fA-F0-9]{24}$/.test(commentId)) { res.status(400).json({ message: 'commentId inválido' }); return; }
        const comment = await this.model.getById(commentId);
        if (!comment) { res.status(404).json({ message: 'Comentario no encontrado' }); return; }
        const belongs = comment.referencia?.tipo === (tipo as any)
          && String(comment.referencia?.id_objeto) === String(oid);
        if (!belongs) { res.status(400).json({ message: 'El comentario no corresponde al recurso indicado' }); return; }
        if ((comment as any).eliminado === true) { res.status(400).json({ message: 'No se puede responder a un comentario eliminado' }); return; }

        // Validar contenido de la respuesta (solo texto)
        const texto = (req.body?.comentario ?? '').toString().trim();
        if (!texto) { res.status(400).json({ message: 'La respuesta no puede estar vacía' }); return; }

        const fecha = new Date();
        const r = await this.model.addReply(commentId, { usuario: auth.user, comentario: texto, fecha });
        if (!r.ok) { res.status(500).json({ message: 'No se pudo agregar la respuesta' }); return; }
        res.status(201).json({ ok: true, id: commentId, reply: { usuario: auth.user, comentario: texto, fecha } });
      } catch (e: any) {
        const msg = e?.message || 'Error agregando respuesta';
        const code = /inválid|no encontrado|vacía/i.test(msg) ? 400 : 500;
        res.status(code).json({ message: 'No se pudo agregar respuesta', error: msg });
      }
    }
}
