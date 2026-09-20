import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

/**
 * User-defined colored labels for grouping applications on the board (e.g.
 * "Dream job", "Backup option"). One label per application — see
 * ApplicationLabel in schema.prisma for why not a many-to-many tag system.
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
  // Applications keep existing (labelId set to null via onDelete: SetNull) —
  // deleting a label un-groups its applications rather than deleting them.
  await prisma.applicationLabel.delete({ where: { id: labelId } });
  return true;
}

/** Verifies a label belongs to the user before letting an application
 * reference it — labelId is a plain foreign key with no built-in ownership
 * scoping, so this is the one place that has to check. */
export async function assertLabelOwnedByUser(userId: string, labelId: string): Promise<void> {
  const label = await prisma.applicationLabel.findFirst({ where: { id: labelId, userId } });
  if (!label) {
    throw new AppError("Label not found.");
  }
}
