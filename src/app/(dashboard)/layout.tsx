import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { NavBar } from "@/components/NavBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <NavBar userName={user.name ?? user.email} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
