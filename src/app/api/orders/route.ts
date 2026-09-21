import { NextResponse } from "next/server";
import { getUser } from "@/server/auth";
import { handler, parseBody, unauthorized } from "@/server/http";
import { listOrders, placeOrder, placeOrderSchema } from "@/server/orders";

export const GET = handler(async () => {
  const user = await getUser();
  if (!user) throw unauthorized();
  return NextResponse.json({ orders: await listOrders(user.id) });
});

export const POST = handler(async (req: Request) => {
  const user = await getUser();
  if (!user) throw unauthorized();
  const input = await parseBody(req, placeOrderSchema);
  return NextResponse.json(await placeOrder(user.id, input), { status: 201 });
});
