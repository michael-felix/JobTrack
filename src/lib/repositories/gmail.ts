import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

/** userId-scoped access to the one Gmail connection a user can have. */

export async function getGmailConnection(userId: string) {
  return prisma.gmailConnection.findUnique({ where: { userId } });
}

export async function saveGmailConnection(userId: string, email: string, refreshToken: string) {
  const refreshTokenEncrypted = encrypt(refreshToken);
  return prisma.gmailConnection.upsert({
    where: { userId },
    create: { userId, email, refreshTokenEncrypted },
    update: { email, refreshTokenEncrypted },
  });
}

export async function deleteGmailConnection(userId: string) {
  await prisma.gmailConnection.deleteMany({ where: { userId } });
}

export async function getDecryptedRefreshToken(userId: string): Promise<string | null> {
  const connection = await getGmailConnection(userId);
  if (!connection) return null;
  return decrypt(connection.refreshTokenEncrypted);
}
