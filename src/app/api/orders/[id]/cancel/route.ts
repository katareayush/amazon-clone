import { NextResponse } from "next/server";
import { getUser } from "@/server/auth";
import { handler, unauthorized } from "@/server/http";
import { cancelOrder } from "@/server/orders";

export const POST = handler(async (_req: Request, ctx: RouteContext<"/api/orders/[id]/cancel">) => {
  const user = await getUser();
  if (!user) throw unauthorized();
  await cancelOrder(user.id, (await ctx.params).id);
  return NextResponse.json({ ok: true });
});
