import { NextResponse } from "next/server";
import { getProduct } from "@/server/catalog";
import { handler, notFound } from "@/server/http";

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/products/[id]">) => {
  const id = Number((await ctx.params).id);
  const product = Number.isInteger(id) ? await getProduct(id) : null;
  if (!product) throw notFound("Product");
  return NextResponse.json({ ...product, searchText: undefined });
});
