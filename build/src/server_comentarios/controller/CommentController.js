"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommentController {
    model;
    constructor(model) {
        this.model = model;
    }
    // POST /api/comments  (auth requerido)
    create = async (req, res) => {
        try {
            const body = req.body ?? {};
            // Sobrescribir usuario desde auth si viene
            const auth = req.auth;
            if (auth?.user)
                body.usuario = auth.user;
            const doc = await this.model.create(body);
            res.status(201).json(doc);
        }
        catch (e) {
            const msg = e?.message || 'Error creando comentario';
            const code = /recurso referenciado/i.test(msg) || /inválid/i.test(msg) ? 400 : 500;
            res.status(code).json({ message: 'No se pudo crear comentario', error: msg });
        }
    };
    // POST /api/:tipo/:idOrOid/comments  (auth requerido)
    // Crea comentario asociado al recurso de la ruta, tomando usuario del auth/body
    createByPath = async (req, res) => {
        try {
            const { tipo, idOrOid } = req.params;
            if (!tipo || !idOrOid) {
                res.status(400).json({ message: 'tipo e id son requeridos' });
                return;
            }
            const isNumericId = /^\d+$/.test(idOrOid);
            const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
            if (!isNumericId && !isObjectId) {
                res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' });
                return;
            }
            const oid = isObjectId
                ? idOrOid
                : await this.model.resolveObjectIdByTipoAndLogicalId(tipo, Number(idOrOid));
            const auth = req.auth;
            const usuario = (auth?.user || req.body?.usuario || '').toString().trim();
            if (!usuario) {
                res.status(400).json({ message: 'usuario requerido' });
                return;
            }
            const comentario = (req.body?.comentario ?? '').toString();
            const valoracionRaw = req.body?.valoracion;
            const valoracion = typeof valoracionRaw === 'undefined' ? undefined : Number(valoracionRaw);
            const payload = { usuario, comentario };
            if (typeof valoracion !== 'undefined' && !Number.isNaN(valoracion))
                payload.valoracion = valoracion;
            payload.referencia = { tipo: tipo, id_objeto: oid };
            const doc = await this.model.create(payload);
            res.status(201).json(doc);
        }
        catch (e) {
            const msg = e?.message || 'Error creando comentario';
            const code = /inválid|requerid|encontrado/i.test(msg) ? 400 : 500;
            res.status(code).json({ message: 'No se pudo crear comentario', error: msg });
        }
    };
    // GET /api/comments/:tipo/:idOrOid
    // Devuelve resumen: producto + comentarios + estadísticas
    summaryByPath = async (req, res) => {
        try {
            const { tipo, idOrOid } = req.params;
            if (!tipo || !idOrOid) {
                res.status(400).json({ message: 'tipo e id son requeridos' });
                return;
            }
            const isNumericId = /^\d+$/.test(idOrOid);
            const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
            if (!isNumericId && !isObjectId) {
                res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' });
                return;
            }
            const oid = isObjectId
                ? idOrOid
                : await this.model.resolveObjectIdByTipoAndLogicalId(tipo, Number(idOrOid));
            const data = await this.model.getSummary(tipo, oid, true);
            res.status(200).json(data);
        }
        catch (e) {
            const msg = e?.message || 'Error obteniendo resumen';
            const code = /inválid|no encontrado/i.test(msg) ? 400 : 500;
            res.status(code).json({ message: 'No se pudo obtener resumen', error: msg });
        }
    };
    // GET /api/:tipo/:idOrOid/comments
    // Devuelve SOLO los comentarios (sin product ni stats)
    listByPath = async (req, res) => {
        try {
            const { tipo, idOrOid } = req.params;
            const { limit, skip, orderBy, order } = (req.query || {});
            if (!tipo || !idOrOid) {
                res.status(400).json({ message: 'tipo e id son requeridos' });
                return;
            }
            const isNumericId = /^\d+$/.test(idOrOid);
            const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
            if (!isNumericId && !isObjectId) {
                res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' });
                return;
            }
            const oid = isObjectId
                ? idOrOid
                : await this.model.resolveObjectIdByTipoAndLogicalId(tipo, Number(idOrOid));
            const lim = Math.max(1, Math.min(100, Number(limit || 50)));
            const sk = Math.max(0, Number(skip || 0));
            const opts = {
                orderBy: orderBy === 'valoracion' ? 'valoracion' : 'fecha',
                order: order === 'asc' ? 'asc' : 'desc',
            };
            const comments = await this.model.listByReference(tipo, oid, lim, sk, opts);
            res.status(200).json(comments);
        }
        catch (e) {
            const msg = e?.message || 'Error listando comentarios';
            const code = /inválid|no encontrado/i.test(msg) ? 400 : 500;
            res.status(code).json({ message: 'No se pudo listar comentarios', error: msg });
        }
    };
    // PUT /api/:tipo/:idOrOid/comments/:commentId  (admin requerido)
    // Edita comentario: solo texto y valoracion (no imagen)
    updateByPath = async (req, res) => {
        try {
            const { tipo, idOrOid, commentId } = req.params;
            if (!tipo || !idOrOid || !commentId) {
                res.status(400).json({ message: 'tipo, id y commentId son requeridos' });
                return;
            }
            // Auth admin
            const auth = req.auth;
            if (!auth) {
                res.status(401).json({ message: 'No autenticado' });
                return;
            }
            if (auth.role !== 'admin') {
                res.status(403).json({ message: 'Solo administrador puede editar comentarios' });
                return;
            }
            // Resolver ObjectId del recurso
            const isNumericId = /^\d+$/.test(idOrOid);
            const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
            if (!isNumericId && !isObjectId) {
                res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' });
                return;
            }
            const oid = isObjectId
                ? idOrOid
                : await this.model.resolveObjectIdByTipoAndLogicalId(tipo, Number(idOrOid));
            // Cargar comentario y validar
            if (!/^[a-fA-F0-9]{24}$/.test(commentId)) {
                res.status(400).json({ message: 'commentId inválido' });
                return;
            }
            const comment = await this.model.getById(commentId);
            if (!comment) {
                res.status(404).json({ message: 'Comentario no encontrado' });
                return;
            }
            const belongs = comment.referencia?.tipo === tipo && String(comment.referencia?.id_objeto) === String(oid);
            if (!belongs) {
                res.status(400).json({ message: 'El comentario no corresponde al recurso indicado' });
                return;
            }
            if (comment.eliminado === true) {
                res.status(400).json({ message: 'No se puede editar un comentario eliminado' });
                return;
            }
            // Validar payload: al menos uno de los campos permitidos
            const { comentario, valoracion } = req.body || {};
            if (Object.prototype.hasOwnProperty.call(req.body || {}, 'imagen')) {
                res.status(400).json({ message: 'No está permitido editar la imagen del comentario' });
                return;
            }
            if (typeof comentario === 'undefined' && typeof valoracion === 'undefined') {
                res.status(400).json({ message: 'Debe enviar al menos un campo: comentario o valoracion' });
                return;
            }
            const result = await this.model.update(commentId, { comentario, valoracion }, auth);
            if (!result.ok) {
                res.status(500).json({ message: 'No se pudo actualizar el comentario' });
                return;
            }
            res.status(200).json({ ok: true, id: commentId });
        }
        catch (e) {
            const msg = e?.message || 'Error editando comentario';
            const code = /inválid|no encontrado|requerid/i.test(msg) ? 400 : 500;
            res.status(code).json({ message: 'No se pudo editar comentario', error: msg });
        }
    };
    // DELETE /api/:tipo/:idOrOid/comments/:commentId  (auth requerido)
    // Elimina un comentario asociado al recurso indicado por la ruta
    removeByPath = async (req, res) => {
        try {
            const { tipo, idOrOid, commentId } = req.params;
            if (!tipo || !idOrOid || !commentId) {
                res.status(400).json({ message: 'tipo, id y commentId son requeridos' });
                return;
            }
            // Confirmación
            // Confirmación opcional: por compatibilidad, si no se envía, asumimos true
            const q = req.query || {};
            const confirmRaw = String((q['confirm'] ?? 'true')).toLowerCase();
            if (!(confirmRaw === 'true' || confirmRaw === '1' || confirmRaw === 'yes')) {
                res.status(400).json({ message: 'Confirmación requerida: agregue ?confirm=true', requiresConfirmation: true });
                return;
            }
            // Resolver ObjectId del recurso
            const isNumericId = /^\d+$/.test(idOrOid);
            const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
            if (!isNumericId && !isObjectId) {
                res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' });
                return;
            }
            const oid = isObjectId
                ? idOrOid
                : await this.model.resolveObjectIdByTipoAndLogicalId(tipo, Number(idOrOid));
            // Auth
            const auth = req.auth;
            if (!auth) {
                res.status(401).json({ message: 'No autenticado' });
                return;
            }
            // Cargar comentario y validar que pertenece a este recurso
            if (!/^[a-fA-F0-9]{24}$/.test(commentId)) {
                res.status(400).json({ message: 'commentId inválido' });
                return;
            }
            const comment = await this.model.getById(commentId);
            if (!comment) {
                res.status(404).json({ message: 'Comentario no encontrado' });
                return;
            }
            const belongs = comment.referencia?.tipo === tipo && String(comment.referencia?.id_objeto) === String(oid);
            if (!belongs) {
                res.status(400).json({ message: 'El comentario no corresponde al recurso indicado' });
                return;
            }
            // Autorización
            if (auth.role !== 'admin' && comment.usuario !== auth.user) {
                res.status(403).json({ message: 'No autorizado a eliminar este comentario' });
                return;
            }
            const result = await this.model.softDelete(commentId, auth);
            if (!result.ok) {
                res.status(500).json({ message: 'No se pudo eliminar' });
                return;
            }
            res.status(200).json({ ok: true, id: commentId, eliminado: true });
        }
        catch (e) {
            const msg = e?.message || 'Error eliminando comentario';
            const code = /inválid|no encontrado/i.test(msg) ? 400 : 500;
            res.status(code).json({ message: 'No se pudo eliminar comentario', error: msg });
        }
    };
    // POST /api/:tipo/:idOrOid/comments/:commentId/replies  (auth requerido)
    // Agrega una respuesta (un nivel) al comentario indicado
    replyByPath = async (req, res) => {
        try {
            const { tipo, idOrOid, commentId } = req.params;
            if (!tipo || !idOrOid || !commentId) {
                res.status(400).json({ message: 'tipo, id y commentId son requeridos' });
                return;
            }
            // Auth: admin o player
            const auth = req.auth;
            if (!auth) {
                res.status(401).json({ message: 'No autenticado' });
                return;
            }
            // Resolver recurso
            const isNumericId = /^\d+$/.test(idOrOid);
            const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrOid);
            if (!isNumericId && !isObjectId) {
                res.status(400).json({ message: 'ID inválido: use id numérico o ObjectId de 24 hex' });
                return;
            }
            const oid = isObjectId
                ? idOrOid
                : await this.model.resolveObjectIdByTipoAndLogicalId(tipo, Number(idOrOid));
            // Validar commentId y pertenencia
            if (!/^[a-fA-F0-9]{24}$/.test(commentId)) {
                res.status(400).json({ message: 'commentId inválido' });
                return;
            }
            const comment = await this.model.getById(commentId);
            if (!comment) {
                res.status(404).json({ message: 'Comentario no encontrado' });
                return;
            }
            const belongs = comment.referencia?.tipo === tipo && String(comment.referencia?.id_objeto) === String(oid);
            if (!belongs) {
                res.status(400).json({ message: 'El comentario no corresponde al recurso indicado' });
                return;
            }
            if (comment.eliminado === true) {
                res.status(400).json({ message: 'No se puede responder a un comentario eliminado' });
                return;
            }
            // Validar contenido de la respuesta (solo texto)
            const texto = (req.body?.comentario ?? '').toString().trim();
            if (!texto) {
                res.status(400).json({ message: 'La respuesta no puede estar vacía' });
                return;
            }
            const fecha = new Date();
            const r = await this.model.addReply(commentId, { usuario: auth.user, comentario: texto, fecha });
            if (!r.ok) {
                res.status(500).json({ message: 'No se pudo agregar la respuesta' });
                return;
            }
            res.status(201).json({ ok: true, id: commentId, reply: { usuario: auth.user, comentario: texto, fecha } });
        }
        catch (e) {
            const msg = e?.message || 'Error agregando respuesta';
            const code = /inválid|no encontrado|vacía/i.test(msg) ? 400 : 500;
            res.status(code).json({ message: 'No se pudo agregar respuesta', error: msg });
        }
    };
}
exports.default = CommentController;
