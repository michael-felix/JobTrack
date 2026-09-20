import { getCurrentUser } from "@/lib/current-user";
import { listApiTokens } from "@/lib/api-token-auth";
import { listLabels } from "@/lib/repositories/labels";
import { getUserSortOrder } from "@/lib/repositories/users";
import { TokensManager } from "@/components/TokensManager";
import { BoardPreferences } from "@/components/BoardPreferences";
import { LabelsManager } from "@/components/LabelsManager";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [tokens, labels, sortOrder] = await Promise.all([
    listApiTokens(user!.id),
    listLabels(user!.id),
    getUserSortOrder(user!.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="heading text-2xl">Settings</h1>
      <BoardPreferences initialSortOrder={sortOrder} />
      <LabelsManager initialLabels={JSON.parse(JSON.stringify(labels))} />
      <TokensManager initialTokens={JSON.parse(JSON.stringify(tokens))} />
    </div>
  );
}
