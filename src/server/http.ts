import { NextResponse } from "next/server";
import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = (what = "Resource") => new ApiError(404, "not_found", `${what} not found`);
export const unauthorized = () => new ApiError(401, "unauthorized", "Sign in to continue");

export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be JSON");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) fields[issue.path.join(".") || "_"] ??= issue.message;
    throw new ApiError(422, "validation_failed", "Some fields are invalid", fields);
  }
  return result.data;
}

/** Wraps a route handler so thrown ApiErrors become consistent JSON responses. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json(
          { error: { code: e.code, message: e.message, fields: e.fields } },
          { status: e.status },
        );
      }
      console.error(e);
      return NextResponse.json({ error: { code: "internal", message: "Something went wrong" } }, { status: 500 });
    }
  };
}
