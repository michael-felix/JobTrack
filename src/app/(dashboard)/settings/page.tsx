import { getCurrentUser } from "@/lib/current-user";
import { listApiTokens } from "@/lib/api-token-auth";
import { TokensManager } from "@/components/TokensManager";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const tokens = await listApiTokens(user!.id);

  return (
    <div>
      <h1 className="heading mb-6 text-2xl">Settings</h1>
      <TokensManager initialTokens={JSON.parse(JSON.stringify(tokens))} />
    </div>
  );
}
