import { prisma } from "@/lib/db";
import type { ApplicationStage, Prisma, SortOrder } from "@prisma/client";

/**
 * All data access for Application records goes through this module. Every
 * function takes `userId` and folds it into the Prisma `where` clause so a
 * caller can never accidentally fetch another user's rows — this is the
 * enforcement point for the "no cross-user access" invariant described in
 * docs/ARCHITECTURE.md.
 */

export interface CreateApplicationInput {
  jobTitle: string;
  company: string;
  location?: string;
  salary?: string;
  jobUrl?: string;
  jobDescription?: string;
  notes?: string;
  followUpDate?: Date | null;
}

/** Maps the user's stored sort preference to the secondary Prisma orderBy
 * clause — pinned applications always sort first regardless of this. */
const SORT_ORDER_CLAUSE: Record<SortOrder, Prisma.ApplicationOrderByWithRelationInput> = {
  DATE_CAPTURED_DESC: { dateCaptured: "desc" },
  DATE_CAPTURED_ASC: { dateCaptured: "asc" },
  UPDATED_AT_DESC: { updatedAt: "desc" },
  COMPANY_ASC: { company: "asc" },
};

export async function listApplications(userId: string, sortOrder: SortOrder) {
  return prisma.application.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, SORT_ORDER_CLAUSE[sortOrder]],
    include: { resumeVersion: true, coverLetter: true, label: true },
  });
}

export async function getApplication(userId: string, applicationId: string) {
  return prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: {
      resumeVersion: true,
      coverLetter: true,
      label: true,
      events: { orderBy: { createdAt: "desc" } },
      matchScores: { orderBy: { createdAt: "desc" }, take: 1 },
      interviewPrep: true,
    },
  });
}

export async function createApplication(userId: string, input: CreateApplicationInput) {
  return prisma.application.create({
    data: {
      userId,
      jobTitle: input.jobTitle,
      company: input.company,
      location: input.location,
      salary: input.salary,
      jobUrl: input.jobUrl,
      jobDescription: input.jobDescription,
      notes: input.notes,
      followUpDate: input.followUpDate ?? null,
      events: {
        create: { toStage: "SAVED", note: "Application created" },
      },
    },
  });
}

export interface UpdateApplicationInput {
  jobTitle?: string;
  company?: string;
  location?: string;
  salary?: string;
  jobUrl?: string;
  jobDescription?: string;
  notes?: string;
  followUpDate?: Date | null;
  resumeVersionId?: string | null;
  coverLetterVersionId?: string | null;
  pinned?: boolean;
  labelId?: string | null;
}

export async function updateApplication(userId: string, applicationId: string, input: UpdateApplicationInput) {
  const existing = await prisma.application.findFirst({ where: { id: applicationId, userId } });
  if (!existing) return null;
  return prisma.application.update({
    where: { id: applicationId },
    data: input,
  });
}

export async function deleteApplication(userId: string, applicationId: string) {
  const existing = await prisma.application.findFirst({ where: { id: applicationId, userId } });
  if (!existing) return false;
  await prisma.application.delete({ where: { id: applicationId } });
  return true;
}

export async function transitionStage(
  userId: string,
  applicationId: string,
  toStage: ApplicationStage,
  note?: string
) {
  const existing = await prisma.application.findFirst({ where: { id: applicationId, userId } });
  if (!existing) return null;

  const [, updated] = await prisma.$transaction([
    prisma.applicationEvent.create({
      data: { applicationId, fromStage: existing.stage, toStage, note },
    }),
    prisma.application.update({
      where: { id: applicationId },
      data: { stage: toStage },
    }),
  ]);
  return updated;
}

export async function addNote(userId: string, applicationId: string, note: string) {
  const existing = await prisma.application.findFirst({ where: { id: applicationId, userId } });
  if (!existing) return null;
  return prisma.applicationEvent.create({
    data: { applicationId, toStage: existing.stage, note },
  });
}
