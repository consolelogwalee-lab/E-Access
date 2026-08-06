"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home, Search, MessageSquare, Heart, X, Settings, LogOut, RefreshCw, Headset,
  ShieldCheck as ShieldIcon, CalendarCheck2 as CalIcon, Wallet, FolderClosed,
  Newspaper, Building2, ClipboardList,
} from "lucide-react";

type User = { full_name: string; email: string; avatar_color: string; role?: string };

const SECTIONS = [
  { label: "Verify Property", href: "/dashboard/validate", icon: ShieldIcon },
  { label: "Inspections", href: "/dashboard/inspections", icon: CalIcon },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Building2 },
  { label: "Documents", href: "/dashboard/documents", icon: FolderClosed },
  { label: "Payment Plans", href: "/dashboard/payments", icon: Wallet },
  { label: "Transactions", href: "/dashboard/transactions", icon: ClipboardList },
  { label: "Request a Property", href: "/dashboard/request", icon: Building2 },
  { label: "News & Info", href: "/news", icon: Newspaper },
];

export function DashboardMobileNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/messages/unread").then((r) => r.json()).then((d) => { if (alive) setUnread(d.unread ?? 0); }).catch(() => {});
    load();
    const t = setInterval(load, 25000);
    return () => { alive = false; clearInterval(t); };
  }, [pathname]);

  const initials = user.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const active = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  async function switchAccount() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  const tab = "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition";

  return (
    <>
      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="mx-auto mb-2 flex max-w-[460px] items-center gap-1 rounded-2xl border border-neutral-200 bg-white/95 px-2 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.14)] backdrop-blur">
          <Link href="/dashboard" className={`${tab} ${active("/dashboard", true) ? "text-brand-900" : "text-neutral-500"}`}>
            <Home size={20} /> Home
          </Link>
          <button onClick={() => setSearchOpen(true)} className={`${tab} text-neutral-500`}>
            <Search size={20} /> Search
          </button>
          <Link href="/dashboard/messages" className={`${tab} relative ${active("/dashboard/messages") ? "text-brand-900" : "text-neutral-500"}`}>
            <span className="relative">
              <MessageSquare size={20} />
              {unread > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </span>
            Messages
          </Link>
          <Link href="/dashboard/saved" className={`${tab} ${active("/dashboard/saved") ? "text-brand-900" : "text-neutral-500"}`}>
            <Heart size={20} /> Saved
          </Link>
          <button onClick={() => setProfileOpen(true)} className={`${tab} text-neutral-500`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: user.avatar_color }}>
              {initials}
            </span>
            Profile
          </button>
        </div>
      </nav>

      {/* Search sheet */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" />
          <div className="pop-up absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
            <form
              onSubmit={(e) => { e.preventDefault(); setSearchOpen(false); router.push(`/dashboard?search=${encodeURIComponent(term)}`); }}
            >
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  autoFocus
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search location, type, estate…"
                  className="h-12 w-full rounded-xl bg-neutral-100 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/40"
                />
              </div>
              <button type="submit" className="btn-text mt-3 h-12 w-full rounded-xl bg-brand-900 text-white">Search</button>
            </form>
          </div>
        </div>
      )}

      {/* Profile bottom sheet */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setProfileOpen(false)}>
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" />
          <div className="pop-up absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: user.avatar_color }}>
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-900">{user.full_name}</div>
                  <div className="truncate text-xs text-neutral-400">{user.email}</div>
                </div>
              </div>
              <button onClick={() => setProfileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-1.5">
              <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3.5 py-3 text-sm font-semibold text-neutral-800 transition active:scale-[0.99]">
                <Settings size={17} className="text-neutral-500" /> Profile Settings
              </Link>
              <a href="/api/consultant/start" className="flex items-center gap-3 rounded-xl border border-[#E2A600]/30 bg-[#E2A600]/10 px-3.5 py-3 text-sm font-semibold text-[#9a7400]">
                <Headset size={17} /> Speak to a Consultant
              </a>
              {user.role === "admin" && (
                <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3.5 py-3 text-sm font-semibold text-neutral-800">
                  <ShieldIcon size={17} className="text-neutral-500" /> Admin Panel
                </Link>
              )}
            </div>

            <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">All sections</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.label} href={s.href} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-[13px] font-medium text-neutral-700 transition active:scale-[0.98]">
                    <Icon size={15} className="shrink-0 text-neutral-500" /> <span className="truncate">{s.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={switchAccount} className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-3 text-sm font-semibold text-neutral-700">
                <RefreshCw size={15} /> Switch account
              </button>
              <button onClick={logout} className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-sm font-semibold text-red-600">
                <LogOut size={15} /> Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
