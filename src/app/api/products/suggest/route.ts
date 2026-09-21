import { NextResponse } from "next/server";
import { suggest } from "@/server/catalog";
import { handler } from "@/server/http";

export const GET = handler(async (req: Request) => {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 100);
  return NextResponse.json({ suggestions: await suggest(q) }, { headers: { "Cache-Control": "public, s-maxage=300" } });
});
