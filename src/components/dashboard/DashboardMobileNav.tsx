"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search, MessageSquare, Heart, X, Settings, LogOut, RefreshCw, Headset, Bell,
  SlidersHorizontal, PanelLeft, ChevronDown, MapPin,
  ShieldCheck as ShieldIcon, CalendarCheck2 as CalIcon, Wallet, FolderClosed,
  Newspaper, Building2, ClipboardList,
} from "lucide-react";
import { LogoFull } from "@/components/Logo";

type User = { full_name: string; email: string; avatar_color: string; role?: string; avatar_url?: string | null };

const SECTIONS = [
  { label: "Verify Property Documents", href: "/dashboard/validate", icon: ShieldIcon },
  { label: "Inspections", href: "/dashboard/inspections", icon: CalIcon },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Building2 },
  { label: "Documents", href: "/dashboard/documents", icon: FolderClosed },
  { label: "Payment Plans", href: "/dashboard/payments", icon: Wallet },
  { label: "Transactions", href: "/dashboard/transactions", icon: ClipboardList },
  { label: "Request a Property", href: "/dashboard/request", icon: Building2 },
  { label: "News & Info", href: "/news", icon: Newspaper },
];

// Scalable location list — ready for multi-country expansion.
const LOCATIONS = ["All Nigeria", "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Kano"];

export function DashboardMobileNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [unread, setUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/messages/unread").then((r) => r.json()).then((d) => { if (alive) setUnread(d.unread ?? 0); }).catch(() => {});
      fetch("/api/notifications").then((r) => r.json()).then((d) => { if (alive) setNotifUnread(d.unread ?? 0); }).catch(() => {});
    };
    load();
    const t = setInterval(load, 25000);
    return () => { alive = false; clearInterval(t); };
  }, [pathname]);

  const initials = user.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  async function switchAccount() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  const iconBtn = "flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 active:scale-95";

  return (
    <>
      {/* ===== Top bar: floating pill, mirrors the bottom dock ===== */}
      <header className="fixed inset-x-0 top-0 z-30 px-[18px] pt-3 lg:hidden">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-neutral-200/70 bg-white/90 py-2 pl-3.5 pr-2 shadow-[0_8px_30px_rgba(0,0,0,0.10)] backdrop-blur-xl">
          <Link href="/dashboard" className="shrink-0"><LogoFull light size={30} /></Link>
          <div className="flex items-center gap-1.5">
            <button onClick={() => window.dispatchEvent(new Event("eaccess-filters-open"))} aria-label="Filters" className={iconBtn}>
              <SlidersHorizontal size={17} />
            </button>
            <Link href="/dashboard/notifications" aria-label="Notifications" className={`${iconBtn} relative`}>
              <Bell size={17} />
              {notifUnread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-neutral-100" />
              )}
            </Link>
            <button onClick={() => setProfileOpen(true)} aria-label="Profile" className="h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-brand-900/10 transition active:scale-95">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white" style={{ background: user.avatar_color }}>
                  {initials}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ===== Bottom bar (Figma) ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 px-[18px] pb-4 lg:hidden">
        <div className="flex items-center gap-2">
          {/* menu -> opens the full dashboard drawer from the left */}
          <button
            onClick={() => window.dispatchEvent(new Event("eaccess-sidebar-open"))}
            aria-label="Open menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white shadow-lg transition active:scale-95"
          >
            <PanelLeft size={19} />
          </button>

          {/* search + location */}
          <div className="flex h-11 min-w-0 flex-1 items-center rounded-full border border-neutral-200 bg-white pl-3.5 pr-1 shadow-lg shadow-neutral-900/5">
            <button onClick={() => setSearchOpen(true)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <Search size={16} className="shrink-0 text-neutral-400" />
              <span className="truncate text-sm text-neutral-400">Search by…</span>
            </button>
            <div className="relative shrink-0">
              <button
                onClick={() => setLocOpen((o) => !o)}
                className="flex h-9 items-center gap-1 rounded-full bg-neutral-100 px-2.5 text-[12px] font-semibold text-neutral-700"
              >
                All Nigeria <ChevronDown size={13} className="text-neutral-400" />
              </button>
              {locOpen && (
                <div className="pop-up absolute bottom-11 right-0 z-20 w-48 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { setLocOpen(false); router.push(loc === "All Nigeria" ? "/dashboard" : `/dashboard?location=${encodeURIComponent(loc)}`); }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-600 transition hover:bg-neutral-100"
                    >
                      <MapPin size={13} className="text-neutral-400" /> {loc}
                    </button>
                  ))}
                  <div className="mt-1 border-t border-neutral-100 px-3 py-2 text-[11px] text-neutral-400">More countries coming soon</div>
                </div>
              )}
            </div>
          </div>

          {/* messages */}
          <Link href="/dashboard/messages" aria-label="Messages" className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 shadow-lg shadow-neutral-900/5">
            <MessageSquare size={18} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          {/* saved */}
          <Link href="/dashboard/saved" aria-label="Saved" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 shadow-lg shadow-neutral-900/5">
            <Heart size={18} />
          </Link>
        </div>
      </nav>

      {/* ===== Search sheet ===== */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" />
          <div className="pop-up absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
            <form onSubmit={(e) => { e.preventDefault(); setSearchOpen(false); router.push(`/dashboard?search=${encodeURIComponent(term)}`); }}>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search location, type, estate…" className="h-12 w-full rounded-xl bg-neutral-100 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/40" />
              </div>
              <button type="submit" className="btn-text mt-3 h-12 w-full rounded-xl bg-brand-900 text-white">Search</button>
            </form>
          </div>
        </div>
      )}

      {/* ===== Profile sheet ===== */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setProfileOpen(false)}>
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" />
          <div className="pop-up absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: user.avatar_color }}>{initials}</span>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-900">{user.full_name}</div>
                  <div className="truncate text-xs text-neutral-400">{user.email}</div>
                </div>
              </div>
              <button onClick={() => setProfileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100" aria-label="Close"><X size={16} /></button>
            </div>

            <div className="mt-4 space-y-1.5">
              <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3.5 py-3 text-sm font-semibold text-neutral-800">
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
                  <Link key={s.label} href={s.href} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5 text-[13px] font-medium text-neutral-700">
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
