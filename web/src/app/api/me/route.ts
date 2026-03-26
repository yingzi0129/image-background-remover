import { NextResponse } from "next/server";

const AUTH_BASE = "https://image-background-remover.caiweihaozxc.workers.dev";

export async function GET() {
  const resp = await fetch(`${AUTH_BASE}/api/me`, { cache: "no-store" });
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "content-type": resp.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
