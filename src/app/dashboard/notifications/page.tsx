"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, CalendarCheck2, BadgeCheck, Bell, CheckCheck } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { timeAgo } from "@/lib/format";

type Notif = {
  id: number; kind: string; title: string; body: string | null; href: string | null;
  read: number; created_at: string;
};

const ICONS: Record<string, typeof Bell> = {
  inquiry: MessageSquare,
  message: MessageSquare,
  inspection: CalendarCheck2,
  verification: BadgeCheck,
  info: Bell,
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => setItems(d.notifications ?? []));
  }, []);
  useEffect(load, [load]);

  async function open(n: Notif) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id }),
    });
    if (n.href) router.push(n.href);
    else load();
  }

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    load();
  }

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Notifications", ""]]} showRegion={false} searchPlaceholder="Search notifications" />
      <div className="mt-6 flex items-center justify-between">
        <h1 className="h3 text-neutral-900">Notifications</h1>
        <button onClick={markAll} className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-600 hover:border-neutral-400">
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>

      {items === null ? (
        <div className="mt-6 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-6 flex h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
          <Bell size={28} className="text-neutral-300" />
          <p className="h4 mt-3 text-neutral-700">Nothing yet</p>
          <p className="body-md mt-1 max-w-[340px] text-neutral-400">
            Inquiries, inspection updates, and verification decisions land here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {items.map((n) => {
            const Icon = ICONS[n.kind] ?? Bell;
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition hover:border-neutral-400 ${
                  n.read ? "border-neutral-200 bg-white" : "border-brand-500/25 bg-blue-50/50"
                }`}
              >
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  n.kind === "verification" ? "bg-lime-100 text-lime-600"
                  : n.kind === "inquiry" ? "bg-blue-100 text-blue-700"
                  : "bg-amber-100 text-amber-700"
                }`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-support-blue" />}
                  </span>
                  {n.body && <span className="body-md mt-0.5 block text-neutral-500">{n.body}</span>}
                  <span className="mt-1 block text-xs text-neutral-400">{timeAgo(n.created_at)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
