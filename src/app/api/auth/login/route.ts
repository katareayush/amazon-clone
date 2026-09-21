import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyPassword } from "@/server/auth";
import { mergeGuestCart } from "@/server/cart";
import { db, schema } from "@/server/db";
import { ApiError, handler, parseBody } from "@/server/http";

const body = z.object({ email: z.string().trim().toLowerCase(), password: z.string().min(1).max(200) });

export const POST = handler(async (req: Request) => {
  const { email, password } = await parseBody(req, body);
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  // Same error for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "invalid_credentials", "Your email or password is incorrect");
  }
  await createSession(user.id);
  await mergeGuestCart(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
});
