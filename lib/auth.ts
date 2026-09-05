import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'expoline_session';
const MAX_AGE = 60 * 60 * 8;
type SessionPayload = { sub: string; exp: number };
function secret() { const value = process.env.AUTH_SECRET; if (!value) throw new Error('AUTH_SECRET is required.'); return value; }
function sign(value: string) { return createHmac('sha256', secret()).update(value).digest('base64url'); }
export function createSessionToken(userId: string) { const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString('base64url'); return `${payload}.${sign(payload)}`; }
export function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split('.'); if (!payload || !signature) return null;
  const expected = sign(payload); const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionPayload; if (!data.sub || data.exp < Math.floor(Date.now() / 1000)) return null; return data; } catch { return null; }
}
export async function getCurrentUser() { const store = await cookies(); const session = verifySessionToken(store.get(COOKIE_NAME)?.value); if (!session) return null; return prisma.user.findFirst({ where: { id: session.sub, active: true } }); }
export async function requireUser() { const user = await getCurrentUser(); if (!user) throw new Error('UNAUTHENTICATED'); return user; }
export function canAccessCompany(user: { role: string; companyId: string | null }, companyId: string) { return user.role === 'SUPER_ADMIN' || user.role === 'EXPOLINE_STAFF' || user.companyId === companyId; }
export { COOKIE_NAME, MAX_AGE };
