import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getApplication } from "@/lib/repositories/applications";
import { listDocumentVersions } from "@/lib/repositories/documents";
import { listLabels } from "@/lib/repositories/labels";
import { ApplicationDetail } from "@/components/ApplicationDetail";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const application = await getApplication(user!.id, id);
  if (!application) notFound();

  const [resumes, coverLetters, labels] = await Promise.all([
    listDocumentVersions(user!.id, "RESUME"),
    listDocumentVersions(user!.id, "COVER_LETTER"),
    listLabels(user!.id),
  ]);

  return (
    <ApplicationDetail
      application={JSON.parse(JSON.stringify(application))}
      resumes={JSON.parse(JSON.stringify(resumes))}
      coverLetters={JSON.parse(JSON.stringify(coverLetters))}
      labels={JSON.parse(JSON.stringify(labels))}
    />
  );
}
