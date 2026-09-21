import { NextResponse } from "next/server";
import { z } from "zod";
import { addItem, MAX_QTY } from "@/server/cart";
import { handler, parseBody } from "@/server/http";

const body = z.object({ productId: z.number().int().positive(), qty: z.number().int().min(1).max(MAX_QTY).default(1) });

export const POST = handler(async (req: Request) => {
  const { productId, qty } = await parseBody(req, body);
  return NextResponse.json(await addItem(productId, qty), { status: 201 });
});
