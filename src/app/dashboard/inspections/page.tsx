"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpDown, ChevronDown, CalendarPlus, MessageSquare, X, BadgeCheck, Loader2 } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";

type Insp = {
  id: number; listing_id: number; mode: string; date: string; time: string; notes: string | null;
  status: string; title: string; location_area: string; location_city: string; image_seed: number;
  price: number; requester_name: string; mine?: boolean;
};

const DOT_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#5ea500",
  completed: "#a1a1a1",
  cancelled: "#dc2626",
  rescheduled: "#2563eb",
};

function fmtDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-xs font-bold text-white">
      {name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
    </span>
  );
}

export default function InspectionsPage() {
  const [items, setItems] = useState<Insp[] | null>(null);
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [linkOpen, setLinkOpen] = useState(false);
  const [linking, setLinking] = useState("");
  const [linked, setLinked] = useState("");

  useEffect(() => {
    setLinked(localStorage.getItem("eaccess_calendar") ?? "");
  }, []);

  function connectCalendar(provider: string) {
    setLinking(provider);
    setTimeout(() => {
      localStorage.setItem("eaccess_calendar", provider);
      setLinked(provider);
      setLinking("");
    }, 1500);
  }

  const load = useCallback(async () => {
    const [mine, owner] = await Promise.all([
      fetch("/api/inspections").then((r) => r.json()),
      fetch("/api/inspections?owner=1").then((r) => r.json()),
    ]);
    const seen = new Set<number>();
    const merged: Insp[] = [];
    for (const i of [...(owner.inspections ?? []), ...(mine.inspections ?? []).map((x: Insp) => ({ ...x, mine: true }))]) {
      if (!seen.has(i.id)) { seen.add(i.id); merged.push(i); }
    }
    setItems(merged);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id: number, status: string) {
    await fetch("/api/inspections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (items ?? [])
      .filter((i) => (i.status === "confirmed" || i.status === "pending") && i.date >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  }, [items]);

  // Calendar grid (Monday-first)
  const weeks = useMemo(() => {
    const first = new Date(month);
    const startDow = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(1 - startDow);
    const out: Date[][] = [];
    for (let w = 0; w < 6; w++) {
      const row: Date[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + w * 7 + d);
        row.push(day);
      }
      out.push(row);
    }
    return out;
  }, [month]);

  const dotsByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const i of items ?? []) {
      map[i.date] = [...(map[i.date] ?? []), DOT_COLORS[i.status] ?? "#a1a1a1"].slice(0, 4);
    }
    return map;
  }, [items]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const isToday = upcoming?.date === todayIso;

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Inspections", ""]]} searchPlaceholder="Search inspections" showRegion={false} />

      <div className="mt-6 flex items-center justify-between">
        <h1 className="h3 text-neutral-900">Inspections</h1>
        <button className="flex h-[34px] items-center gap-2 rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white">
          <ArrowUpDown size={13} /> Most Recent
        </button>
      </div>

      <div className="mx-auto mt-6 max-w-[560px]">
        {/* Next inspection banner */}
        <div className="rounded-2xl border-2 border-lime-600/70 bg-gradient-to-b from-neutral-800 to-neutral-950 px-5 py-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Next Inspection</span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              {upcoming ? (
                <>
                  {isToday ? "Today" : fmtDate(upcoming.date)} • {upcoming.time} <ArrowRight size={15} />
                </>
              ) : (
                "None scheduled"
              )}
            </span>
          </div>
        </div>

        {/* Calendar */}
        <div className="mt-7">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              onContextMenu={(e) => { e.preventDefault(); setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)); }}
              className="text-base font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4"
              title="Click: next month • Right-click: previous month"
            >
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </button>
            <div className="flex items-center gap-2">
              <span className="flex h-8 items-center gap-1.5 rounded-full bg-neutral-100 px-3 text-xs font-medium text-neutral-600">
                All <ChevronDown size={12} />
              </span>
              <button
                onClick={() => setLinkOpen(true)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  linked ? "bg-lime-100 text-lime-600" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
                title={linked ? `${linked} Calendar connected` : "Link your calendar"}
              >
                <CalendarPlus size={14} />
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="rounded-full bg-neutral-100 py-1 text-center text-[11px] font-medium text-neutral-500">{d}</div>
            ))}
            {weeks.flat().map((day, i) => {
              const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
              const inMonth = day.getMonth() === month.getMonth();
              const today = iso === todayIso;
              const dots = dotsByDate[iso] ?? [];
              return (
                <div
                  key={i}
                  className={`flex h-[52px] flex-col items-center rounded-lg pt-1.5 text-sm ${
                    inMonth ? "bg-neutral-100/80 text-neutral-800" : "bg-neutral-50 text-neutral-300"
                  }`}
                >
                  <span className={today ? "rounded-full bg-support-blue px-2.5 py-0.5 text-xs font-semibold text-white" : ""}>
                    {day.getDate()}
                  </span>
                  {dots.length > 0 && (
                    <span className="mt-1 flex gap-0.5">
                      {dots.map((c, j) => <span key={j} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Request cards */}
      {items === null ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-8 flex h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
          <p className="h4 text-neutral-700">No inspections yet</p>
          <p className="body-md mt-1 text-neutral-400">Book one from any property page and it lands here.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((i) => (
            <div key={i.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={i.mine ? "You" : i.requester_name} />
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{i.mine ? "Your request" : i.requester_name}</div>
                    <div className="text-xs text-neutral-400">Interested in {i.title}</div>
                  </div>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                  <MessageSquare size={14} />
                </span>
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-400">Inspection Type</dt>
                  <dd className="font-medium text-neutral-800">{i.mode === "remote" ? "Remote Inspection" : "Physical Site Inspection"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-400">Status</dt>
                  <dd>
                    <span
                      className="rounded-md px-2.5 py-1 text-xs font-semibold capitalize"
                      style={{
                        background: i.status === "confirmed" ? "#dbeafe" : i.status === "pending" ? "#fef3c7" : i.status === "completed" ? "#ecfcca" : i.status === "cancelled" ? "#e5e5e5" : "#dbeafe",
                        color: i.status === "confirmed" ? "#1d4ed8" : i.status === "pending" ? "#b45309" : i.status === "completed" ? "#5ea500" : i.status === "cancelled" ? "#525252" : "#1d4ed8",
                      }}
                    >
                      {i.status === "pending" ? "Awaiting Confirmation" : i.status}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-400">{i.status === "completed" ? "Completed on" : i.status === "cancelled" ? "Reason" : "Preferred Date & Time"}</dt>
                  <dd className="font-medium text-neutral-800">
                    {i.status === "cancelled" ? "Due to scheduling conflict" : `${fmtDate(i.date)} • ${i.time}`}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 space-y-2">
                {i.status === "pending" && !i.mine && (
                  <>
                    <button onClick={() => setStatus(i.id, "confirmed")} className="btn-text h-11 w-full rounded-xl bg-support-blue text-white transition hover:brightness-110">
                      Confirm Schedule
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="h-10 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200">Reschedule</button>
                      <button onClick={() => setStatus(i.id, "cancelled")} className="h-10 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200">
                        Decline
                      </button>
                    </div>
                  </>
                )}
                {i.status === "pending" && i.mine && (
                  <div className="grid grid-cols-2 gap-2">
                    <button className="h-10 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200">Reschedule</button>
                    <button onClick={() => setStatus(i.id, "cancelled")} className="h-10 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200">
                      Cancel Request
                    </button>
                  </div>
                )}
                {i.status === "confirmed" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button className="h-10 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200">Reschedule</button>
                    <button onClick={() => setStatus(i.id, "completed")} className="h-10 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200">
                      Mark Completed
                    </button>
                  </div>
                )}
                {i.status === "completed" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button className="h-10 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200">View Summary</button>
                    <button className="h-10 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200">View Conversation</button>
                  </div>
                )}
                {i.status === "cancelled" && (
                  <>
                    <button onClick={() => setStatus(i.id, "pending")} className="btn-text h-11 w-full rounded-xl bg-support-blue text-white transition hover:brightness-110">
                      Reopen Request
                    </button>
                    <button className="h-10 w-full rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200">Clear</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link calendar modal */}
      {linkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-6 backdrop-blur-[2px]" onClick={() => setLinkOpen(false)}>
          <div className="w-full max-w-[400px] rounded-3xl bg-white p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Link Your Calendar</h3>
              <button onClick={() => setLinkOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"><X size={16} /></button>
            </div>
            {linked ? (
              <div className="mt-4 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-100">
                  <BadgeCheck size={30} className="text-lime-600" />
                </span>
                <p className="mt-4 text-base font-semibold text-neutral-900">{linked} Calendar connected</p>
                <p className="body-md mt-1 text-neutral-500">
                  Confirmed inspections will sync to your calendar automatically, with reminders before each visit.
                </p>
                <button
                  onClick={() => { localStorage.removeItem("eaccess_calendar"); setLinked(""); }}
                  className="mt-5 text-sm font-medium text-neutral-500 underline-offset-4 hover:underline"
                >
                  Manage connection — disconnect
                </button>
              </div>
            ) : (
              <>
                <p className="body-md mt-1 text-neutral-400">
                  Sync confirmed inspections straight to your calendar so you never miss a visit.
                </p>
                <div className="mt-5 space-y-3">
                  {["Google", "Apple"].map((p) => (
                    <button
                      key={p}
                      onClick={() => connectCalendar(p)}
                      disabled={!!linking}
                      className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
                    >
                      {linking === p ? <Loader2 size={16} className="animate-spin" /> : null}
                      {linking === p ? `Connecting to ${p} Calendar…` : `Connect ${p} Calendar`}
                    </button>
                  ))}
                </div>
                <p className="caption mt-4 text-center text-neutral-400">
                  Demo mode — the connection is simulated. OAuth wiring comes with production credentials.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
