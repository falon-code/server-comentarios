import { Request, Response } from 'express';
import { signToken } from '../auth/TokenService';

export default class AuthController {
  // POST /api/login con headers x-user/x-pass
  readonly login = (req: Request, res: Response): void => {
    try {
      const auth = (req as Request & { auth?: { user: string; role: 'player' | 'admin' } }).auth;
      if (!auth) {
        res.status(401).json({ message: 'No autenticado' });
        return;
      }
      const token = signToken({ username: auth.user, role: auth.role }, 4 * 60 * 60);
      res.status(200).json({ token, user: { username: auth.user, role: auth.role } });
    } catch (e: unknown) {
      const error = e as Error;
      res.status(500).json({ message: 'Error en login', error: error.message });
    }
  };
}
