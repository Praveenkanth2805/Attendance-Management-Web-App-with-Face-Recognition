import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is missing or too short");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(username: string): string {
  const issuedAt = Date.now();
  const payload = `${username}.${issuedAt}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [username, issuedAtStr, sig] = parts;
  const payload = `${username}.${issuedAtStr}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  // timing-safe compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_MAX_AGE * 1000) return false;
  return true;
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME ?? "";
  const p = process.env.ADMIN_PASSWORD ?? "";
  if (!u || !p) return false;
  return username === u && password === p;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_TTL = SESSION_MAX_AGE;