import { NextFunction, Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  auth?: {
    user: string;
    role: 'player' | 'admin';
  };
}

/*
  Auth mínimo por headers para desarrollo.
  Requiere:
   - x-auth-user: string (nombre del usuario)
   - x-auth-role: 'player' | 'admin'
*/
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Username-based auth: accept identity from headers, body or query
  const hdrUser = req.header('x-auth-user');
  const hdrRole = req.header('x-auth-role');
  const bodyUser = (req.body?.usuario ?? req.body?.user) as string | undefined;
  const bodyRole = (req.body?.role ?? req.body?.rol) as string | undefined;
  const qq: Record<string, unknown> = req.query ?? {};
  const qUser = (qq['usuario'] ?? qq['user']) as string | undefined;
  const qRole = (qq['role'] ?? qq['rol']) as string | undefined;

  const user = (hdrUser ?? bodyUser ?? qUser ?? '').toString().trim();
  const role = (hdrRole ?? bodyRole ?? qRole ?? '').toString().trim().toLowerCase();
  if (!user) {
    res.status(401).json({ message: 'No autenticado: falta usuario' });
    return;
  }
  // Normalize role
  const r: 'admin' | 'player' = role === 'administrator' || role === 'admin' ? 'admin' : 'player';
  (req as AuthenticatedRequest).auth = { user, role: r };
  next();
}

// Para login: valida user/pass y emite token
export function loginHandler(req: Request, res: Response, next: NextFunction): void {
  const headerUser = req.header('user');
  const headerPass = req.header('pass');
  if (!headerUser || !headerPass) {
    res.status(400).json({ message: 'Faltan credenciales' });
    return;
  }
  // Mantener compatibilidad mínima: if provided, accept as-is and infer role 'player'
  (req as AuthenticatedRequest).auth = { user: headerUser, role: 'player' };
  next();
}
