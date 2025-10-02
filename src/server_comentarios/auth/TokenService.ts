import crypto from 'crypto';

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

const header = { alg: 'HS256', typ: 'JWT' };

export interface TokenPayload {
  username: string;
  role: 'player' | 'admin';
  exp: number; // epoch seconds
}

export function signToken(
  payload: Omit<TokenPayload, 'exp'>,
  ttlSeconds = 7200,
  secret = process.env['AUTH_SECRET'] ?? 'dev-secret'
): string {
  const now = Math.floor(Date.now() / 1000);
  const full: TokenPayload = { ...payload, exp: now + ttlSeconds } as TokenPayload;
  const h64 = base64url(JSON.stringify(header));
  const p64 = base64url(JSON.stringify(full));
  const data = `${h64}.${p64}`;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

export function verifyToken(token: string, secret = process.env['AUTH_SECRET'] ?? 'dev-secret'): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h64, p64, sig] = parts as [string, string, string];
  const data = `${h64}.${p64}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (sig !== expected) return null;
  try {
    const json = JSON.parse(
      Buffer.from(p64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    ) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (json.exp && json.exp < now) return null;
    return json;
  } catch {
    return null;
  }
}
