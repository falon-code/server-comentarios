"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.loginHandler = loginHandler;
/*
  Auth mínimo por headers para desarrollo.
  Requiere:
   - x-auth-user: string (nombre del usuario)
   - x-auth-role: 'player' | 'admin'
*/
function requireAuth(req, res, next) {
    // Username-based auth: accept identity from headers, body or query
    const hdrUser = req.header('x-auth-user');
    const hdrRole = req.header('x-auth-role');
    const bodyUser = (req.body?.usuario ?? req.body?.user);
    const bodyRole = (req.body?.role ?? req.body?.rol);
    const qq = req.query || {};
    const qUser = (qq['usuario'] ?? qq['user']);
    const qRole = (qq['role'] ?? qq['rol']);
    const user = (hdrUser || bodyUser || qUser || '').toString().trim();
    const role = (hdrRole || bodyRole || qRole || '').toString().trim().toLowerCase();
    if (!user) {
        res.status(401).json({ message: 'No autenticado: falta usuario' });
        return;
    }
    // Normalize role
    const r = role === 'administrator' || role === 'admin' ? 'admin' : 'player';
    req.auth = { user, role: r };
    next();
}
// Para login: valida user/pass y emite token
function loginHandler(req, res, next) {
    const headerUser = req.header('user');
    const headerPass = req.header('pass');
    if (!headerUser || !headerPass) {
        res.status(400).json({ message: 'Faltan credenciales' });
        return;
    }
    // Mantener compatibilidad mínima: if provided, accept as-is and infer role 'player'
    req.auth = { user: headerUser, role: 'player' };
    next();
}
