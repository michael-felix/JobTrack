import { prisma } from "@/lib/db";
import { getApplicationOwnedByUser } from "@/lib/repositories/matchScores";

export interface InterviewPrepInput {
  companyResearch?: string;
  technicalQuestions?: unknown[];
  behavioralQuestions?: unknown[];
  checklist?: unknown[];
  notes?: string;
}

export async function getInterviewPrep(userId: string, applicationId: string) {
  const application = await getApplicationOwnedByUser(userId, applicationId);
  if (!application) return null;
  return prisma.interviewPrep.findUnique({ where: { applicationId } });
}

export async function upsertInterviewPrep(userId: string, applicationId: string, input: InterviewPrepInput) {
  const application = await getApplicationOwnedByUser(userId, applicationId);
  if (!application) return null;

  return prisma.interviewPrep.upsert({
    where: { applicationId },
    create: {
      applicationId,
      companyResearch: input.companyResearch,
      technicalQuestions: (input.technicalQuestions ?? []) as object,
      behavioralQuestions: (input.behavioralQuestions ?? []) as object,
      checklist: (input.checklist ?? []) as object,
      notes: input.notes,
    },
    update: {
      ...(input.companyResearch !== undefined ? { companyResearch: input.companyResearch } : {}),
      ...(input.technicalQuestions !== undefined ? { technicalQuestions: input.technicalQuestions as object } : {}),
      ...(input.behavioralQuestions !== undefined ? { behavioralQuestions: input.behavioralQuestions as object } : {}),
      ...(input.checklist !== undefined ? { checklist: input.checklist as object } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}
