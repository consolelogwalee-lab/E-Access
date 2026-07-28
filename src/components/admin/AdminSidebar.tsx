"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, Inbox, FileCheck2, ArrowLeft, LogOut, ShieldCheck, Menu, X, Newspaper, HandCoins,
  Handshake, UserRoundCheck, SearchCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LogoFull } from "@/components/Logo";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Listings", href: "/admin/listings", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Leads", href: "/admin/leads", icon: Inbox },
  { label: "Offers", href: "/admin/offers", icon: HandCoins },
  { label: "Transactions", href: "/admin/transactions", icon: Handshake },
  { label: "Validations", href: "/admin/validations", icon: ShieldCheck },
  { label: "Verifications", href: "/admin/verifications", icon: FileCheck2 },
  { label: "Agents", href: "/admin/agents", icon: UserRoundCheck },
  { label: "Requests", href: "/admin/requests", icon: SearchCheck },
  { label: "Info Center", href: "/admin/posts", icon: Newspaper },
];

export function AdminSidebar({ user }: { user: { full_name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#0b0b12] text-white shadow-lg lg:hidden"
      >
        <Menu size={18} />
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-neutral-950/50 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    <aside className={`fixed inset-y-2 left-2 z-50 flex w-[246px] flex-col rounded-2xl bg-[#0b0b12] p-4 text-white shadow-2xl shadow-black/40 transition-transform duration-200 lg:z-30 lg:translate-x-0 ${
      mobileOpen ? "translate-x-0" : "-translate-x-[110%]"
    }`}>
      <div className="flex items-center justify-between px-1.5 pt-1">
        <Link href="/"><LogoFull size={28} /></Link>
        <button onClick={() => setMobileOpen(false)} className="text-white/30 lg:hidden" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#e9c46a]/15 px-3 py-2 text-xs font-semibold text-[#e9c46a]">
        <ShieldCheck size={14} /> Admin Panel
      </div>

      <nav className="scroll-thin mt-6 min-h-0 flex-1 overflow-y-auto">
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
    </>
  );
}
