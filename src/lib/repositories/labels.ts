import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

/**
 * User-defined colored labels for grouping applications on the board (e.g.
 * "Dream job", "Backup option"). Many-to-many — an application can carry
 * several labels at once.
 */

export async function listLabels(userId: string) {
  return prisma.applicationLabel.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createLabel(userId: string, name: string, color: string) {
  const existing = await prisma.applicationLabel.findUnique({
    where: { userId_name: { userId, name } },
  });
  if (existing) {
    throw new AppError("You already have a label with this name.");
  }
  return prisma.applicationLabel.create({ data: { userId, name, color } });
}

export async function updateLabel(
  userId: string,
  labelId: string,
  input: { name?: string; color?: string }
) {
  const existing = await prisma.applicationLabel.findFirst({ where: { id: labelId, userId } });
  if (!existing) return null;
  return prisma.applicationLabel.update({ where: { id: labelId }, data: input });
}

export async function deleteLabel(userId: string, labelId: string) {
  const existing = await prisma.applicationLabel.findFirst({ where: { id: labelId, userId } });
  if (!existing) return false;
  // Applications keep existing — deleting a label just drops it from the
  // many-to-many join table, un-grouping affected applications rather than
  // deleting them.
  await prisma.applicationLabel.delete({ where: { id: labelId } });
  return true;
}

/** Verifies every given label id belongs to the user before letting an
 * application reference it — otherwise a user could attach another user's
 * label by guessing its id. */
export async function assertLabelsOwnedByUser(userId: string, labelIds: string[]): Promise<void> {
  if (labelIds.length === 0) return;
  const count = await prisma.applicationLabel.count({ where: { id: { in: labelIds }, userId } });
  if (count !== new Set(labelIds).size) {
    throw new AppError("Label not found.");
  }
}
