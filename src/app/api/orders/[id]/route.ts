import { NextResponse } from "next/server";
import { getUser } from "@/server/auth";
import { handler, notFound, unauthorized } from "@/server/http";
import { getOrder } from "@/server/orders";

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/orders/[id]">) => {
  const user = await getUser();
  if (!user) throw unauthorized();
  const order = await getOrder(user.id, (await ctx.params).id);
  if (!order) throw notFound("Order");
  return NextResponse.json(order);
});
