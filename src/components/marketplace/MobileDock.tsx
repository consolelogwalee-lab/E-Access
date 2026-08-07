"use client";
import Link from "next/link";
import { Menu, ShieldCheck, Search, MessageSquare, Headset } from "lucide-react";

/**
 * Bottom navigation dock for mobile — search sits at the bottom (modern
 * browser-style), the menu trigger is bottom-left, and it stays out of the
 * way on desktop.
 */
export function MobileDock({
  onMenu,
  onSearch,
  authed,
}: {
  onMenu: () => void;
  onSearch?: () => void;
  authed: boolean;
}) {
  const item = "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium";
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto mb-3 flex max-w-[440px] items-center justify-between rounded-2xl border border-neutral-200 bg-white/95 px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.14)] backdrop-blur">
        <button onClick={onMenu} className={`${item} flex-1 text-neutral-600`} aria-label="Menu">
          <Menu size={20} />
          Menu
        </button>
        <Link href={authed ? "/dashboard/validate" : "/auth/login?next=/dashboard/validate"} className={`${item} flex-1 text-neutral-600`}>
          <ShieldCheck size={20} />
          Validate
        </Link>
        <button
          onClick={onSearch}
          className="mx-1 flex h-12 w-12 shrink-0 -translate-y-3 items-center justify-center rounded-full bg-brand-900 text-white shadow-lg shadow-brand-900/30 transition active:scale-95"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
        <Link href={authed ? "/dashboard/messages" : "/auth/login?next=/dashboard/messages"} className={`${item} flex-1 text-neutral-600`}>
          <MessageSquare size={20} />
          Messages
        </Link>
        <Link href={authed ? "/api/consultant/start" : "/auth/login?next=/api/consultant/start"} className={`${item} flex-1 text-brand-900`}>
          <Headset size={20} />
          Consultant
        </Link>
      </div>
    </div>
  );
}
