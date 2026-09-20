import { prisma } from "@/lib/db";
import type { SortOrder } from "@prisma/client";

/** Kept separate from AuthedUser (src/lib/auth.ts) rather than added there:
 * that type is resolved on every authenticated request across the whole
 * app, and sortOrder is only needed when rendering the board. */
export async function getUserSortOrder(userId: string): Promise<SortOrder> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { sortOrder: true } });
  return user.sortOrder;
}

export async function updateUserSortOrder(userId: string, sortOrder: SortOrder) {
  await prisma.user.update({ where: { id: userId }, data: { sortOrder } });
}
