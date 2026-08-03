"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Widget6, MagicStick3, ChatLine, Chart, FolderWithFiles, DocumentAdd,
  BellOff, Settings, SiderbarMinimalistic, AltArrowDown, WalletMoney, Notebook, ShieldCheck,
} from "@solar-icons/react";
import { LogOut, Plus, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoFull } from "@/components/Logo";

const MAIN = [
  { label: "Home", href: "/", icon: Widget6, neverActive: true },
  { label: "Discover", href: "/dashboard", icon: MagicStick3, exact: true },
  { label: "Saved Listings", href: "/dashboard/saved", icon: Widget6 },
  { label: "Messages", href: "/dashboard/messages", icon: ChatLine },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Chart },
  { label: "Documents Vault", href: "/dashboard/documents", icon: FolderWithFiles },
  { label: "Inspections", href: "/dashboard/inspections", icon: DocumentAdd },
  { label: "Payment Plans", href: "/dashboard/payments", icon: WalletMoney },
  { label: "Verify Property", href: "/dashboard/validate", icon: ShieldCheck },
  { label: "Transactions", href: "/dashboard/transactions", icon: Chart },
  { label: "Request a Property", href: "/dashboard/request", icon: MagicStick3 },
];
const SECONDARY = [
  { label: "Agent Profile", href: "/dashboard/agent", icon: Widget6 },
  { label: "News & Info", href: "/news", icon: Notebook, neverActive: true },
  { label: "Notifications", href: "/dashboard/notifications", icon: BellOff },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = { label: string; href: string; icon: any; exact?: boolean; neverActive?: boolean };

export function Sidebar({ user }: { user: { full_name: string; email: string; avatar_color: string; role?: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/messages/unread")
        .then((r) => r.json())
        .then((d) => { if (alive) setUnread(d.unread ?? 0); })
        .catch(() => {});
    load();
    const t = setInterval(load, 25000);
    return () => { alive = false; clearInterval(t); };
  }, [pathname]);
  useEffect(() => {
    document.body.dataset.sidebar = collapsed ? "collapsed" : "open";
    return () => { delete document.body.dataset.sidebar; };
  }, [collapsed]);
  const initials = user.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function isActive(item: Item) {
    if (item.neverActive) return false;
    if (item.label === "Discover") {
      return (
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/property") ||
        pathname.startsWith("/dashboard/developer")
      );
    }
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  function NavItem({ item }: { item: Item }) {
    const active = isActive(item);
    const Icon = item.icon;
    return (
      <li>
        <Link
          href={item.href}
          className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-[11px] text-[13.5px] font-medium tracking-[0.1px] transition-all duration-200 ${
            active
              ? "bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-white/[0.12]"
              : "text-white/55 hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-white/90"
          }`}
        >
          {active && (
            <span className="absolute inset-y-2 left-0 w-[2.5px] rounded-full bg-gradient-to-b from-white/80 via-white/60 to-white/20" />
          )}
          <Icon
            size={19}
            weight="LineDuotone"
            className={`transition-colors duration-200 ${active ? "text-white" : "text-white/50 group-hover:text-white/85"}`}
          />
          {item.label}
          {item.label === "Messages" && unread > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-support-blue px-1.5 text-[10px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>
      </li>
    );
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#0b0b12] text-white shadow-lg lg:hidden"
      >
        <Menu size={18} />
      </button>
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Open sidebar"
          className="fixed left-4 top-4 z-40 hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#0b0b12] text-white shadow-lg transition hover:scale-105 lg:flex"
        >
          <SiderbarMinimalistic size={17} weight="LineDuotone" />
        </button>
      )}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-neutral-950/50 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    <aside
      className={`fixed inset-y-2 left-2 z-50 flex w-[286px] flex-col rounded-2xl border border-white/[0.06] p-4 text-white shadow-2xl shadow-black/40 transition-transform duration-200 lg:z-30 ${
        mobileOpen ? "translate-x-0" : "-translate-x-[110%]"
      } ${collapsed ? "lg:-translate-x-[110%]" : "lg:translate-x-0"}`}
      style={{ background: "linear-gradient(175deg,#0d0d1a 0%,#08080f 55%,#070710 100%)" }}
    >
      <div className="flex items-center justify-between px-1.5 pt-1">
        <Link href="/"><LogoFull size={30} /></Link>
        <button
          onClick={() => { setMobileOpen(false); setCollapsed(true); }}
          className="text-white/30 transition hover:text-white/60"
          aria-label="Close sidebar"
        >
          <span className="lg:hidden"><X size={18} /></span>
          <span className="hidden lg:inline"><SiderbarMinimalistic size={18} weight="LineDuotone" /></span>
        </button>
      </div>

      <nav className="mt-9 flex-1 overflow-y-auto scroll-thin">
        <div className="px-3.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/30">Main</div>
        <ul className="mt-2.5 space-y-1">
          {MAIN.map((item) => <NavItem key={item.label} item={item} />)}
        </ul>
        <div className="mt-8 px-3.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/30">Secondary</div>
        <ul className="mt-2.5 space-y-1">
          {SECONDARY.map((item) => <NavItem key={item.label} item={item} />)}
        </ul>
        <button
          onClick={() => window.dispatchEvent(new Event("eaccess-tour-open"))}
          className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white/80"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-[10px] font-bold">?</span>
          How E-Access works
        </button>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="mt-6 flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-[13px] font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
          >
            Admin Panel <span aria-hidden>→</span>
          </Link>
        )}
      </nav>

      <div className="relative pt-3">
        {menuOpen && (
          <button
            onClick={logout}
            className="absolute -top-9 left-0 flex w-full items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-red-600 shadow-lg hover:bg-red-50"
          >
            <LogOut size={15} /> Log out
          </button>
        )}
        <button onClick={() => setMenuOpen((o) => !o)} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 text-left transition hover:border-white/[0.12] hover:bg-white/[0.06]">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ring-2 ring-white/10"
            style={{ background: user.avatar_color }}
          >
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold text-white">{user.full_name}</span>
            <span className="block truncate text-[11.5px] text-white/35">{user.email}</span>
          </span>
          <AltArrowDown size={16} weight="LineDuotone" className="text-white/40" />
        </button>
        <Link
          href="/dashboard/portfolio/new"
          className="btn-gold mt-2.5 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[14px]"
        >
          <Plus size={15} /> Add Listing
        </Link>
      </div>
    </aside>
    </>
  );
}
