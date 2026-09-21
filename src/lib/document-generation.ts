import Anthropic from "@anthropic-ai/sdk";
import { AppError } from "@/lib/errors";

const MODEL = "claude-sonnet-5";

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AppError("Document generation isn't configured — ANTHROPIC_API_KEY is not set.");
  }
  return new Anthropic({ apiKey });
}

export type GeneratedDocumentType = "RESUME" | "COVER_LETTER";

/** Deliberately strict about not inventing content: the model only ever
 * sees the candidate's own base document and is instructed to reorganize
 * and rephrase it, never to add employers, skills, or achievements that
 * aren't already there. The caller still shows the result for review
 * before it's saved as a real DocumentVersion — this never writes on its
 * own. */
const SYSTEM_PROMPT = `You are helping a job seeker tailor an existing document to a specific job posting.
Rules:
- Only reorganize, rephrase, and re-prioritize content that already appears in the candidate's base document. Never invent employers, titles, dates, skills, or achievements that aren't already present in it.
- Stay strictly truthful and grounded in the source material.
- Match the tone and plain-text format of the base document — no markdown headers, bullets as asterisks, or other markup.
- Output only the document text itself: no preamble, explanation, or sign-off.`;

export async function generateTailoredDocument(params: {
  type: GeneratedDocumentType;
  jobTitle: string;
  company: string;
  jobDescription: string;
  baseDocumentText: string;
}): Promise<string> {
  const { type, jobTitle, company, jobDescription, baseDocumentText } = params;
  const docLabel = type === "RESUME" ? "résumé" : "cover letter";

  const anthropic = client();
  let message;
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Tailor this candidate's ${docLabel} for the following job.

Job title: ${jobTitle}
Company: ${company}

Job description:
"""
${jobDescription}
"""

Candidate's base ${docLabel}:
"""
${baseDocumentText}
"""

Produce the tailored ${docLabel} text now.`,
        },
      ],
    });
  } catch {
    throw new AppError("Document generation failed — the AI service didn't respond. Try again in a moment.");
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AppError("Document generation failed — no text was returned.");
  }
  return textBlock.text.trim();
}
