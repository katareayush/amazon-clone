import { NextResponse } from "next/server";
import { getCart } from "@/server/cart";
import { handler } from "@/server/http";

export const GET = handler(async () => NextResponse.json(await getCart()));
