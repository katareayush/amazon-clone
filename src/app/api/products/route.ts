import { NextResponse } from "next/server";
import { parseSearch, searchProducts } from "@/server/catalog";
import { handler } from "@/server/http";

export const GET = handler(async (req: Request) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  return NextResponse.json(await searchProducts(parseSearch(params)));
});
