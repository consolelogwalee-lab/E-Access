"use client";
import Link from "next/link";
import {
  X, Home, Compass, ShieldCheck, MessageSquare, CalendarCheck2, Heart,
  Newspaper, Headset, LayoutDashboard, LogIn, UserPlus,
} from "lucide-react";
import { LogoFull } from "@/components/Logo";

type Entry = { label: string; href: string; icon: typeof Home; gated?: boolean };

// Priority order: Home, Discover, then the top features, then the rest.
const ENTRIES: Entry[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Discover", href: "/dashboard", icon: Compass, gated: true },
  { label: "Verify Property Documents", href: "/dashboard/validate", icon: ShieldCheck, gated: true },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, gated: true },
  { label: "Inspections", href: "/dashboard/inspections", icon: CalendarCheck2, gated: true },
  { label: "Saved Listings", href: "/dashboard/saved", icon: Heart, gated: true },
  { label: "Speak to a Consultant", href: "/api/consultant/start", icon: Headset, gated: false },
  { label: "News & Info", href: "/news", icon: Newspaper },
];

/**
 * A floating navigation panel that slides up from the bottom without covering
 * the whole screen, keeping the current page visible behind it.
 */
export function FloatingMenu({
  open,
  onClose,
  authed,
}: {
  open: boolean;
  onClose: () => void;
  authed: boolean;
}) {
  if (!open) return null;
  const hrefFor = (e: Entry) =>
    e.gated && !authed ? `/auth/login?next=${encodeURIComponent(e.href)}` : e.href;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="pop-up absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
        <div className="mb-4 flex items-center justify-between">
          <LogoFull light size={26} />
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100" aria-label="Close menu">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {ENTRIES.map((e) => {
            const Icon = e.icon;
            return (
              <Link
                key={e.label}
                href={hrefFor(e)}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3.5 py-3 text-sm font-semibold text-neutral-800 transition active:scale-[0.98] hover:border-neutral-300"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900/5 text-brand-900">
                  <Icon size={17} />
                </span>
                <span className="min-w-0 leading-tight">{e.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-4">
          {authed ? (
            <Link
              href="/dashboard"
              onClick={onClose}
              className="btn-text flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-900 text-white"
            >
              <LayoutDashboard size={16} /> Go to my dashboard
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/auth/login"
                onClick={onClose}
                className="btn-text flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 text-neutral-800"
              >
                <LogIn size={16} /> Log in
              </Link>
              <Link
                href="/auth"
                onClick={onClose}
                className="btn-text flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-900 text-white"
              >
                <UserPlus size={16} /> Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
