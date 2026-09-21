import { getCurrentUser } from "@/lib/current-user";
import { listApplications } from "@/lib/repositories/applications";
import { getUserSortOrder } from "@/lib/repositories/users";
import { listLabels } from "@/lib/repositories/labels";
import { getGmailConnection } from "@/lib/repositories/gmail";
import { KanbanBoard } from "@/components/KanbanBoard";

export default async function BoardPage() {
  const user = await getCurrentUser();
  const sortOrder = await getUserSortOrder(user!.id);
  const [applications, labels, gmailConnection] = await Promise.all([
    listApplications(user!.id, sortOrder),
    listLabels(user!.id),
    getGmailConnection(user!.id),
  ]);

  return (
    <div>
      <h1 className="heading mb-6 text-2xl">Application Pipeline</h1>
      <KanbanBoard
        initialApplications={JSON.parse(JSON.stringify(applications))}
        labels={JSON.parse(JSON.stringify(labels))}
        gmailConnected={!!gmailConnection}
      />
    </div>
  );
}
