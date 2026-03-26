export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthUrl } from "@/lib/google-auth";

export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin;
    return NextResponse.redirect(getGoogleOAuthUrl(origin));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login init failed" }, { status: 500 });
  }
}
