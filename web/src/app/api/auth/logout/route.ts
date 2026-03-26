export const runtime = "edge";

import { NextResponse } from "next/server";

const AUTH_BASE = "https://image-background-remover.caiweihaozxc.workers.dev";

export async function GET() {
  return NextResponse.redirect(`${AUTH_BASE}/api/auth/logout`);
}
