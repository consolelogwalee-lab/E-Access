import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/auth/login?next=/admin");
  return (
    <div className="min-h-screen bg-neutral-100">
      <AdminSidebar user={{ full_name: admin.full_name, email: admin.email }} />
      <div className="min-h-screen p-2 lg:pl-[264px]">
        <div className="min-h-[calc(100vh-16px)] p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
