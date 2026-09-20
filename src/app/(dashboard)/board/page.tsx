import { getCurrentUser } from "@/lib/current-user";
import { listApplications } from "@/lib/repositories/applications";
import { getUserSortOrder } from "@/lib/repositories/users";
import { KanbanBoard } from "@/components/KanbanBoard";

export default async function BoardPage() {
  const user = await getCurrentUser();
  const sortOrder = await getUserSortOrder(user!.id);
  const applications = await listApplications(user!.id, sortOrder);

  return (
    <div>
      <h1 className="heading mb-6 text-2xl">Application Pipeline</h1>
      <KanbanBoard initialApplications={JSON.parse(JSON.stringify(applications))} />
    </div>
  );
}
