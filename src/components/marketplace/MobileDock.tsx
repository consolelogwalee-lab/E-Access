"use client";
import Link from "next/link";
import { Menu, Home, Search, MessageSquare, Heart } from "lucide-react";

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
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="mx-auto mb-3 flex max-w-[440px] items-center justify-between gap-1 rounded-2xl border border-neutral-200 bg-white/95 px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.14)] backdrop-blur">
        <button onClick={onMenu} className={`${item} text-neutral-600`} aria-label="Menu">
          <Menu size={20} />
          Menu
        </button>
        <Link href="/" className={`${item} text-neutral-600`}>
          <Home size={20} />
          Home
        </Link>
        <button
          onClick={onSearch}
          className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-brand-900 text-white shadow-lg shadow-brand-900/30 transition active:scale-95"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
        <Link href={authed ? "/dashboard/messages" : "/auth/login?next=/dashboard/messages"} className={`${item} text-neutral-600`}>
          <MessageSquare size={20} />
          Messages
        </Link>
        <Link href={authed ? "/dashboard/saved" : "/auth/login?next=/dashboard/saved"} className={`${item} text-neutral-600`}>
          <Heart size={20} />
          Saved
        </Link>
      </div>
    </div>
  );
}
