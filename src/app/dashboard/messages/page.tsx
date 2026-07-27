"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, Paperclip, Send, Mic, MoreHorizontal, MessageSquarePlus } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { timeAgo } from "@/lib/format";

type Thread = {
  id: number; counterpart_name: string; counterpart_role: string;
  last_body: string | null; last_at: string | null; message_count: number;
};
type Msg = { id: number; thread_id: number; sender_id: number; body: string; created_at: string };

const QUICK_CHIPS = [
  "Request property documents",
  "Ask about payment structure",
  "Schedule inspection",
  "Inquire about infrastructure",
];

const AVATAR_COLORS = ["#7C3AED", "#0E7490", "#B45309", "#166534", "#9F1239"];

function dayLabel(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
  const diff = (Date.now() - d.getTime()) / 86400000;
  if (diff < 1) return "Now";
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [meId, setMeId] = useState(0);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/threads").then((r) => r.json()).then((d) => {
      setThreads(d.threads ?? []);
      if ((d.threads ?? []).length && activeId === null) setActiveId(d.threads[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadThread = useCallback((id: number) => {
    fetch(`/api/threads/${id}`).then((r) => r.json()).then((d) => {
      setMessages(d.messages ?? []);
      setMeId(d.meId ?? 0);
    });
  }, []);

  useEffect(() => { if (activeId) loadThread(activeId); }, [activeId, loadThread]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text?: string) {
    const body = (text ?? draft).trim();
    if (!body || !activeId) return;
    setDraft("");
    setMessages((m) => [...m, { id: Date.now(), thread_id: activeId, sender_id: meId || -1, body, created_at: new Date().toISOString() }]);
    const res = await fetch(`/api/threads/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const d = await res.json();
    if (d.messages) setMessages(d.messages);
  }

  const active = (threads ?? []).find((t) => t.id === activeId);
  const shownThreads = (threads ?? []).filter(
    (t) =>
      (!search || t.counterpart_name.toLowerCase().includes(search.toLowerCase())) &&
      (tab === "all" || t.last_at === null)
  );

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col">
      <Topbar
        crumbs={[["Main", "/dashboard"], ["Messages", ""]]}
        searchPlaceholder="Search by chat and people"
        showRegion={false}
      />

      <div className="mt-5 grid min-h-0 flex-1 gap-6 lg:grid-cols-[298px_1fr]">
        {/* Inbox */}
        <div className="flex min-h-0 flex-col">
          <h1 className="h3 text-neutral-900">Inbox</h1>
          <p className="body-r text-neutral-400">All your messages live here</p>

          <div className="mt-4 flex gap-5 border-b border-neutral-200 text-sm">
            <button
              onClick={() => setTab("all")}
              className={`border-b-2 pb-2 font-medium transition ${tab === "all" ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400"}`}
            >
              All ({(threads ?? []).length})
            </button>
            <button
              onClick={() => setTab("unread")}
              className={`border-b-2 pb-2 font-medium transition ${tab === "unread" ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400"}`}
            >
              Unread
            </button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people…"
            className="mt-3 h-9 w-full rounded-full bg-neutral-100 px-4 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/30"
          />

          <div className="mt-2 min-h-0 flex-1 divide-y divide-neutral-100 overflow-y-auto scroll-thin">
            {threads === null ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="my-2 h-14 animate-pulse rounded-xl bg-white" />)
            ) : shownThreads.length === 0 ? (
              <p className="body-md py-8 text-center text-neutral-400">Nothing here.</p>
            ) : (
              shownThreads.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`flex w-full items-center gap-3 px-1 py-3 text-left transition ${activeId === t.id ? "" : "hover:bg-white/70"}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {t.counterpart_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-semibold ${activeId === t.id ? "text-support-blue" : "text-neutral-900"}`}>
                      {t.counterpart_name}
                    </span>
                    <span className="block truncate text-xs text-neutral-400">
                      {t.last_body ?? "Start a conversation"}
                    </span>
                  </span>
                  <span className={`shrink-0 text-[11px] ${dayLabel(t.last_at) === "Now" ? "font-semibold text-support-blue" : "text-neutral-400"}`}>
                    {dayLabel(t.last_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <MessageSquarePlus size={34} className="text-neutral-300" />
              <p className="h4 mt-4 text-neutral-700">Start a new conversation</p>
              <p className="body-md mt-1 max-w-[280px] text-neutral-400">
                Pick a consultant from your inbox to talk about listings, documents, or inspections.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                    {active.counterpart_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                      {active.counterpart_name}
                      <BadgeCheck size={14} className="text-[#e9c46a]" />
                    </div>
                    <div className="text-xs text-neutral-400 capitalize">
                      {active.counterpart_role} • Regarding: Verified listings
                    </div>
                  </div>
                </div>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-neutral-50/60 px-5 py-5 scroll-thin">
                {messages.map((m) => {
                  const mine = m.sender_id !== 0;
                  return (
                    <div key={m.id}>
                      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[420px] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                            mine ? "rounded-br-md bg-support-blue text-white" : "rounded-bl-md bg-neutral-200/80 text-neutral-800"
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                      <div className={`mt-1 text-[11px] text-neutral-400 ${mine ? "text-right" : ""}`}>
                        {mine ? "Delivered" : "Automated message"} • {timeAgo(m.created_at)}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-neutral-100 p-4">
                <div className="mb-3 flex gap-2 overflow-x-auto scroll-thin">
                  {QUICK_CHIPS.map((c) => (
                    <button
                      key={c}
                      onClick={() => send(c)}
                      className="shrink-0 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-full bg-neutral-100 py-1.5 pl-4 pr-1.5">
                  <Paperclip size={16} className="shrink-0 text-neutral-400" />
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Type your message..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  />
                  <Mic size={16} className="shrink-0 text-neutral-400" />
                  <button
                    onClick={() => send()}
                    aria-label="Send"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-white transition hover:bg-brand-500"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
