import { NextResponse } from "next/server";
import { checkCredentials, createSessionToken, SESSION_COOKIE, SESSION_TTL } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password)
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });

    if (!checkCredentials(username, password))
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });

    const token = createSessionToken(username);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Unable to sign in. Try again." }, { status: 500 });
  }
}