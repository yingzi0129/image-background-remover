export const runtime = "edge";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const resp = NextResponse.redirect(`${url.origin}/`);
  resp.cookies.set("ibr_session", "", { path: "/", maxAge: 0, httpOnly: true, secure: true, sameSite: "lax" });
  return resp;
}
