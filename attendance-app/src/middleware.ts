import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

// Edge-safe signature check (Web Crypto, no Node crypto)
async function verifyEdge(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [username, issuedAtStr, sig] = parts;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;
  const MAX_AGE = 8 * 60 * 60 * 1000;
  if (Date.now() - issuedAt > MAX_AGE) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const macBuf = await crypto.subtle.sign("HMAC", key, enc.encode(`${username}.${issuedAtStr}`));
  const expected = Array.from(new Uint8Array(macBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === sig;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const secret = process.env.SESSION_SECRET ?? "";
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const ok = secret ? await verifyEdge(token, secret) : false;

  if (ok) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};