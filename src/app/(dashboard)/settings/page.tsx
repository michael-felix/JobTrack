import { getCurrentUser } from "@/lib/current-user";
import { listApiTokens } from "@/lib/api-token-auth";
import { TokensManager } from "@/components/TokensManager";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const tokens = await listApiTokens(user!.id);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>
      <TokensManager initialTokens={JSON.parse(JSON.stringify(tokens))} />
    </div>
  );
}
