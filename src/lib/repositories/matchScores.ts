import { prisma } from "@/lib/db";
import type { MatchScoreResult } from "@/lib/match-score";

/**
 * MatchScore rows don't carry userId directly, so ownership is checked via the
 * parent Application (which is userId-scoped) before any read/write here.
 */

export async function getApplicationOwnedByUser(userId: string, applicationId: string) {
  return prisma.application.findFirst({ where: { id: applicationId, userId } });
}

export async function saveMatchScore(
  userId: string,
  applicationId: string,
  documentVersionId: string,
  result: MatchScoreResult
) {
  const application = await getApplicationOwnedByUser(userId, applicationId);
  if (!application) return null;

  const document = await prisma.documentVersion.findFirst({ where: { id: documentVersionId, userId } });
  if (!document) return null;

  return prisma.matchScore.create({
    data: {
      applicationId,
      documentVersionId,
      score: result.score,
      missingKeywords: result.missingKeywords,
      missingSkills: result.missingSkills,
      strengths: result.strengths,
    },
  });
}

export async function getLatestMatchScore(userId: string, applicationId: string) {
  const application = await getApplicationOwnedByUser(userId, applicationId);
  if (!application) return null;
  return prisma.matchScore.findFirst({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
    include: { documentVersion: true },
  });
}
