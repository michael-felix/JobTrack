/** An error whose `.message` is safe to send verbatim to the client (a
 * deliberate, user-facing validation/business-rule message we wrote
 * ourselves — "Invalid email or password.", not "table does not exist").
 * Anything else thrown (Prisma errors, unexpected bugs) must never reach
 * the client as-is: see errorResponse() in api-helpers.ts. */
export class AppError extends Error {}
