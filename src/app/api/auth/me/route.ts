import { NextResponse } from "next/server";
import { getUser } from "@/server/auth";
import { handler } from "@/server/http";

export const GET = handler(async () => NextResponse.json({ user: await getUser() }));
