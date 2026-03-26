export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchGoogleUserInfo } from "@/lib/google-auth";
import { createSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin;
    const code = req.nextUrl.searchParams.get("code");
    const error = req.nextUrl.searchParams.get("error");

    if (error) return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error)}`);
    if (!code) return NextResponse.redirect(`${origin}/?auth_error=missing_code`);

    const tokens = await exchangeCodeForTokens(code, origin);
    const user = await fetchGoogleUserInfo(tokens.access_token);

    const db = process.env.USERS_DB;
    if (!db) throw new Error("Missing USERS_DB binding");

    // @ts-ignore
    await db.prepare(`INSERT INTO users (google_sub, email, email_verified, name, given_name, family_name, avatar_url, locale, last_login_at, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(google_sub) DO UPDATE SET
      email=excluded.email,
      email_verified=excluded.email_verified,
      name=excluded.name,
      given_name=excluded.given_name,
      family_name=excluded.family_name,
      avatar_url=excluded.avatar_url,
      locale=excluded.locale,
      last_login_at=CURRENT_TIMESTAMP,
      updated_at=CURRENT_TIMESTAMP`)
      .bind(user.sub, user.email || null, user.email_verified ? 1 : 0, user.name || null, user.given_name || null, user.family_name || null, user.picture || null, user.locale || null)
      .run();

    const token = await createSession({ uid: user.sub, email: user.email, name: user.name, picture: user.picture });
    const resp = NextResponse.redirect(`${origin}/`);
    resp.cookies.set("ibr_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return resp;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Callback failed" }, { status: 500 });
  }
}
