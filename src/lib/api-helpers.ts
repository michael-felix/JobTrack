import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/current-user";
import { AppError } from "@/lib/errors";

/** Only AppError's `.message` is ever safe to send to a client — it's
 * reserved for messages we deliberately wrote to be user-facing ("Invalid
 * email or password."). Anything else thrown (a Prisma error, a bug, a
 * missing-table error from unrun migrations) must never reach the client
 * verbatim: those can and do contain internal file paths, query details,
 * and even inlined source snippets. Log the real error server-side and
 * return a generic message instead. */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
