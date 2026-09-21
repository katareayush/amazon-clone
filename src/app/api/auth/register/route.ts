import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword } from "@/server/auth";
import { mergeGuestCart } from "@/server/cart";
import { db, schema } from "@/server/db";
import { ApiError, handler, parseBody } from "@/server/http";

const body = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.email("Enter a valid email address").transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Passwords must be at least 8 characters").max(200),
});

export const POST = handler(async (req: Request) => {
  const { name, email, password } = await parseBody(req, body);
  const [user] = await db
    .insert(schema.users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .onConflictDoNothing({ target: schema.users.email })
    .returning({ id: schema.users.id, name: schema.users.name, email: schema.users.email });
  if (!user) {
    throw new ApiError(409, "email_taken", "An account already exists with this email", { email: "Email already in use" });
  }
  await createSession(user.id);
  await mergeGuestCart(user.id);
  return NextResponse.json({ user }, { status: 201 });
});
