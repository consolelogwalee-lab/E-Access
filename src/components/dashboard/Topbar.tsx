"use client";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Bell, MessageSquare, Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Topbar({
  initialSearch = "",
  crumbs = [["Main", "/dashboard"], ["Discover", ""]] as [string, string][],
  searchPlaceholder = "Search by location, property type, or estate name",
  showRegion = true,
}: {
  initialSearch?: string;
  crumbs?: [string, string][];
  searchPlaceholder?: string;
  showRegion?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialSearch);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => setUnread(d.unread ?? 0)).catch(() => {});
  }, []);

  return (
    <div className="flex items-center gap-4 pl-12 lg:pl-0">
      <nav className="hidden shrink-0 items-center gap-1.5 text-[13px] md:flex">
        {crumbs.map(([label, href], i) => (
          <span key={label} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-neutral-300">/</span>}
            {href ? (
              <Link href={href} className="text-neutral-400 transition hover:text-neutral-700">{label}</Link>
            ) : (
              <span className="font-medium text-neutral-800">{label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="relative flex flex-1 items-center">
        <Search size={15} className="absolute left-4 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && router.push(`/dashboard?search=${encodeURIComponent(q)}`)}
          placeholder={searchPlaceholder}
          className="h-[42px] w-full rounded-full bg-neutral-100 pl-10 pr-32 text-sm outline-none transition placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-brand-500/30"
        />
        {showRegion && (
          <button className="absolute right-1.5 flex h-[32px] items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-medium text-neutral-700 shadow-sm">
            All Nigeria <ChevronDown size={13} className="text-neutral-400" />
          </button>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-4 pr-1">
        <Link href="/dashboard/notifications" aria-label="Notifications" className="relative text-neutral-500 transition hover:text-neutral-900">
          <Bell size={19} />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        <Link href="/dashboard/messages" aria-label="Messages" className="text-neutral-500 transition hover:text-neutral-900">
          <MessageSquare size={19} />
        </Link>
        <Link href="/dashboard/saved" aria-label="Saved listings" className="text-neutral-500 transition hover:text-neutral-900">
          <Heart size={19} />
        </Link>
      </div>
    </div>
  );
}
