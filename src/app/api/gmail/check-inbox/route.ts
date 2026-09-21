import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { AppError } from "@/lib/errors";
import { searchRejectionEmails } from "@/lib/gmail";
import { getDecryptedRefreshToken } from "@/lib/repositories/gmail";
import { listApplications } from "@/lib/repositories/applications";

const TERMINAL_STAGES = new Set(["OFFER", "REJECTED"]);

/** Matches recent Gmail messages that look like rejections to open
 * applications by a plain company-name substring check. Deliberately
 * dumb and over-inclusive: this only ever returns *suggestions* — nothing
 * here changes a stage on its own, so a false positive costs the user one
 * click of "Ignore," while a missed match defeats the feature entirely. */
export async function POST() {
  try {
    const user = await requireCurrentUser();
    const refreshToken = await getDecryptedRefreshToken(user.id);
    if (!refreshToken) {
      throw new AppError("Gmail isn't connected. Connect it from Settings first.");
    }

    const [messages, applications] = await Promise.all([
      searchRejectionEmails(refreshToken),
      listApplications(user.id, "UPDATED_AT_DESC"),
    ]);
    const openApplications = applications.filter((a) => !TERMINAL_STAGES.has(a.stage));

    const matchedApplicationIds = new Set<string>();
    const suggestions: {
      applicationId: string;
      company: string;
      jobTitle: string;
      subject: string;
      from: string;
      snippet: string;
    }[] = [];

    for (const message of messages) {
      const haystack = `${message.from} ${message.subject} ${message.snippet}`.toLowerCase();
      const match = openApplications.find(
        (a) => !matchedApplicationIds.has(a.id) && haystack.includes(a.company.toLowerCase())
      );
      if (match) {
        matchedApplicationIds.add(match.id);
        suggestions.push({
          applicationId: match.id,
          company: match.company,
          jobTitle: match.jobTitle,
          subject: message.subject,
          from: message.from,
          snippet: message.snippet,
        });
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    return errorResponse(error);
  }
}
