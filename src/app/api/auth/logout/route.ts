import { NextResponse } from "next/server";
import { destroySession } from "@/server/auth";
import { handler } from "@/server/http";

export const POST = handler(async () => {
  await destroySession();
  return new NextResponse(null, { status: 204 });
});
