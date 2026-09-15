export type ApplicationStage = "SAVED" | "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED";

export const STAGES: ApplicationStage[] = ["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"];

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export interface ApplicationSummary {
  id: string;
  jobTitle: string;
  company: string;
  location: string | null;
  salary: string | null;
  jobUrl: string | null;
  stage: ApplicationStage;
  followUpDate: string | null;
  updatedAt: string;
}

export type DocumentType = "RESUME" | "COVER_LETTER";

export interface DocumentVersionSummary {
  id: string;
  type: DocumentType;
  label: string;
  fileName: string;
  extractedText: string;
  changeSummary: string | null;
  createdAt: string;
}

export interface ApplicationEventData {
  id: string;
  fromStage: ApplicationStage | null;
  toStage: ApplicationStage;
  note: string | null;
  createdAt: string;
}

export interface MatchScoreData {
  id: string;
  score: number;
  missingKeywords: string[];
  missingSkills: string[];
  strengths: string[];
  createdAt: string;
  documentVersionId: string;
}

export interface InterviewPrepData {
  id: string;
  companyResearch: string | null;
  technicalQuestions: string[];
  behavioralQuestions: string[];
  checklist: { text: string; done: boolean }[];
  notes: string | null;
}

export interface ApplicationDetailData extends ApplicationSummary {
  notes: string | null;
  jobDescription: string | null;
  resumeVersionId: string | null;
  coverLetterVersionId: string | null;
  resumeVersion: DocumentVersionSummary | null;
  coverLetter: DocumentVersionSummary | null;
  events: ApplicationEventData[];
  matchScores: MatchScoreData[];
  interviewPrep: InterviewPrepData | null;
}
