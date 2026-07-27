"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, Inbox, FileCheck2, ArrowLeft, LogOut, ShieldCheck,
} from "lucide-react";
import { LogoFull } from "@/components/Logo";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Listings", href: "/admin/listings", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Leads", href: "/admin/leads", icon: Inbox },
  { label: "Verifications", href: "/admin/verifications", icon: FileCheck2 },
];

export function AdminSidebar({ user }: { user: { full_name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-2 left-2 z-30 hidden w-[246px] flex-col rounded-2xl bg-[#0b0b12] p-4 text-white shadow-2xl shadow-black/40 lg:flex">
      <Link href="/" className="px-1.5 pt-1"><LogoFull size={28} /></Link>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#e9c46a]/15 px-3 py-2 text-xs font-semibold text-[#e9c46a]">
        <ShieldCheck size={14} /> Admin Panel
      </div>

      <nav className="mt-6 flex-1">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-[11px] text-[13.5px] font-medium transition ${
                    active ? "bg-white/[0.08] text-white ring-1 ring-white/10" : "text-white/55 hover:bg-white/[0.04] hover:text-white/90"
                  }`}
                >
                  <item.icon size={17} /> {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-white/10 pt-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] text-white/55 transition hover:bg-white/[0.04] hover:text-white/90">
          <ArrowLeft size={15} /> Back to app
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] text-white/55 transition hover:bg-white/[0.04] hover:text-red-300">
          <LogOut size={15} /> Log out
        </button>
        <div className="px-3.5 pt-1">
          <div className="truncate text-[12px] font-semibold text-white">{user.full_name}</div>
          <div className="truncate text-[11px] text-white/35">{user.email}</div>
        </div>
      </div>
    </aside>
  );
}
