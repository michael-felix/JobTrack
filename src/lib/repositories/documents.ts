import { prisma } from "@/lib/db";
import type { DocumentType } from "@prisma/client";

/** userId-scoped access to DocumentVersion (résumé / cover letter) records. */

export async function listDocumentVersions(userId: string, type?: DocumentType) {
  return prisma.documentVersion.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentVersion(userId: string, id: string) {
  return prisma.documentVersion.findFirst({ where: { id, userId } });
}

export interface CreateDocumentVersionInput {
  type: DocumentType;
  label: string;
  fileName: string;
  storagePath: string;
  extractedText: string;
  changeSummary?: string;
}

export async function createDocumentVersion(userId: string, input: CreateDocumentVersionInput) {
  return prisma.documentVersion.create({
    data: { userId, ...input },
  });
}

export async function deleteDocumentVersion(userId: string, id: string) {
  const existing = await prisma.documentVersion.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.documentVersion.delete({ where: { id } });
  return true;
}
