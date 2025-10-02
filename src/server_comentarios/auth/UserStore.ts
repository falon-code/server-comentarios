import { readFileSync } from 'fs';
import { join } from 'path';

export interface UserRecord {
  username: string;
  password: string;
  role: 'player' | 'admin';
}

export class UserStore {
  private users: UserRecord[] = [];

  constructor() {
    try {
      // Allow overriding the users file location via env (e.g., to mount a volume)
      const p = process.env['USERS_FILE'] ?? join(process.cwd(), 'database', 'users.json');
      const raw = readFileSync(p, 'utf-8');
      this.users = JSON.parse(raw);
      if (!Array.isArray(this.users)) throw new Error('users.json debe ser un arreglo');
    } catch (e) {
      console.warn('[Auth] No se pudo cargar database/users.json:', (e as Error).message);
      this.users = [];
    }
  }

  find(username: string, password: string): UserRecord | undefined {
    return this.users.find(u => u.username === username && u.password === password);
  }
}

export const userStore = new UserStore();
