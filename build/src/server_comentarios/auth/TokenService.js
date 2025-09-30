"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const crypto_1 = __importDefault(require("crypto"));
function base64url(input) {
    return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
const header = { alg: 'HS256', typ: 'JWT' };
function signToken(payload, ttlSeconds = 7200, secret = process.env['AUTH_SECRET'] || 'dev-secret') {
    const now = Math.floor(Date.now() / 1000);
    const full = { ...payload, exp: now + ttlSeconds };
    const h64 = base64url(JSON.stringify(header));
    const p64 = base64url(JSON.stringify(full));
    const data = `${h64}.${p64}`;
    const sig = crypto_1.default
        .createHmac('sha256', secret)
        .update(data)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${data}.${sig}`;
}
function verifyToken(token, secret = process.env['AUTH_SECRET'] || 'dev-secret') {
    const parts = token.split('.');
    if (parts.length !== 3)
        return null;
    const [h64, p64, sig] = parts;
    const data = `${h64}.${p64}`;
    const expected = crypto_1.default
        .createHmac('sha256', secret)
        .update(data)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    if (sig !== expected)
        return null;
    try {
        const json = JSON.parse(Buffer.from(p64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'));
        const now = Math.floor(Date.now() / 1000);
        if (json.exp && json.exp < now)
            return null;
        return json;
    }
    catch {
        return null;
    }
}
