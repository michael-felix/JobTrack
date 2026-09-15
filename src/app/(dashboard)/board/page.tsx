import { getCurrentUser } from "@/lib/current-user";
import { listApplications } from "@/lib/repositories/applications";
import { KanbanBoard } from "@/components/KanbanBoard";

export default async function BoardPage() {
  const user = await getCurrentUser();
  const applications = await listApplications(user!.id);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Application Pipeline</h1>
      <KanbanBoard initialApplications={JSON.parse(JSON.stringify(applications))} />
    </div>
  );
}
