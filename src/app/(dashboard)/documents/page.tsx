import { getCurrentUser } from "@/lib/current-user";
import { listDocumentVersions } from "@/lib/repositories/documents";
import { DocumentsManager } from "@/components/DocumentsManager";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  const documents = await listDocumentVersions(user!.id);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Résumés &amp; Cover Letters</h1>
      <DocumentsManager initialDocuments={JSON.parse(JSON.stringify(documents))} />
    </div>
  );
}
