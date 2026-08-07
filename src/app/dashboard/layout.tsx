import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { CompareBar } from "@/components/dashboard/CompareBar";
import { Tour } from "@/components/dashboard/Tour";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  return (
    <div className="min-h-screen bg-white lg:bg-neutral-100">
      <Sidebar user={{ full_name: user.full_name, email: user.email, avatar_color: user.avatar_color, avatar_url: user.avatar_url, role: user.role }} />
      <div className="dash-main min-h-screen p-0 transition-[padding] duration-200 lg:p-2 lg:pl-[304px]">
        <div className="min-h-[calc(100vh-16px)] rounded-none bg-white px-4 pb-28 pt-[80px] md:px-6 lg:rounded-2xl lg:p-6">{children}</div>
      </div>
      <DashboardMobileNav user={{ full_name: user.full_name, email: user.email, avatar_color: user.avatar_color, avatar_url: user.avatar_url, role: user.role }} />
      <CompareBar />
      <Tour />
    </div>
  );
}
