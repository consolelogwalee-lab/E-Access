import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  return (
    <div className="min-h-screen bg-neutral-100">
      <Sidebar user={{ full_name: user.full_name, email: user.email, avatar_color: user.avatar_color }} />
      <div className="min-h-screen p-2 lg:pl-[304px]">
        <div className="min-h-[calc(100vh-16px)] rounded-2xl p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
