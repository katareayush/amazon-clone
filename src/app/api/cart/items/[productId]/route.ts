import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_QTY, setItemQty } from "@/server/cart";
import { ApiError, handler, parseBody } from "@/server/http";

type Ctx = RouteContext<"/api/cart/items/[productId]">;

async function productId(ctx: Ctx) {
  const id = Number((await ctx.params).productId);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "invalid_id", "Invalid product id");
  return id;
}

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const { qty } = await parseBody(req, z.object({ qty: z.number().int().min(0).max(MAX_QTY) }));
  return NextResponse.json(await setItemQty(await productId(ctx), qty));
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  return NextResponse.json(await setItemQty(await productId(ctx), 0));
});
