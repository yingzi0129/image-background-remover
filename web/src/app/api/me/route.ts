export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ibr_session")?.value;
    if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });
    const session = await verifySession(token);

    const db = process.env.USERS_DB;
    if (!db) throw new Error("Missing USERS_DB binding");

    // @ts-ignore
    const user = await db.prepare(`SELECT id, google_sub, email, email_verified, name, given_name, family_name, avatar_url, locale, created_at, updated_at, last_login_at FROM users WHERE google_sub = ?1`)
      .bind(session.uid)
      .first();

    if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
