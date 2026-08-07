"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, MessageSquare, Check, X } from "lucide-react";
import { naira, timeAgo } from "@/lib/format";
import { toast } from "@/components/Ui";

type Lead = {
  id: number; sender_id: number; message: string; status: string; created_at: string;
  sender_name: string; sender_email: string;
  listing_id: number; listing_title: string; price: number; location_city: string; owner_name: string | null;
};
type InspLead = {
  id: number; mode: string; date: string; time: string; status: string; created_at: string;
  requester_name: string; requester_email: string; listing_id: number; listing_title: string; location_city: string;
};

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function download(name: string, content: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
  a.download = name;
  a.click();
}

export default function AdminLeads() {
  const router = useRouter();
  const [tab, setTab] = useState<"inquiries" | "inspections">("inquiries");
  const [data, setData] = useState<{ inquiries: Lead[]; inspections: InspLead[] } | null>(null);

  const load = () => fetch("/api/admin/leads").then((r) => r.json()).then(setData);
  useEffect(() => { load(); }, []);

  async function messageInquirer(senderId: number) {
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId: senderId }),
    });
    const d = await res.json().catch(() => ({}));
    router.push(res.ok && d.id ? `/dashboard/messages?thread=${d.id}` : "/dashboard/messages");
  }

  async function decideInspection(id: number, status: "confirmed" | "cancelled") {
    const res = await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) { toast(status === "confirmed" ? "Inspection confirmed." : "Inspection declined.", "success"); load(); }
    else toast("Could not update.", "warn");
  }

  function exportCsv() {
    if (!data) return;
    if (tab === "inquiries") {
      download(
        "eaccess-leads-inquiries.csv",
        toCsv(data.inquiries.map((l) => ({
          date: l.created_at, name: l.sender_name, email: l.sender_email, status: l.status,
          listing: l.listing_title, city: l.location_city, price: l.price, owner: l.owner_name, message: l.message,
        })))
      );
    } else {
      download(
        "eaccess-leads-inspections.csv",
        toCsv(data.inspections.map((l) => ({
          created: l.created_at, name: l.requester_name, email: l.requester_email, mode: l.mode,
          date: l.date, time: l.time, status: l.status, listing: l.listing_title, city: l.location_city,
        })))
      );
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h3 text-neutral-900">Leads</h1>
          <p className="body-md text-neutral-400">Every inquiry and inspection request on the platform, ready for your CRM.</p>
        </div>
        <button onClick={exportCsv} className="btn-text flex h-10 items-center gap-2 rounded-xl bg-brand-900 px-5 text-white transition hover:bg-brand-500">
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="mt-5 flex gap-1 border-b border-neutral-200">
        {([["inquiries", `Inquiries (${data?.inquiries.length ?? "…"})`], ["inspections", `Inspection Requests (${data?.inspections.length ?? "…"})`]] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === k ? "border-brand-500 text-brand-500" : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {tab === "inquiries" ? (
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {(data?.inquiries ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800">{l.sender_name}</div>
                    <div className="text-xs text-neutral-400">{l.sender_email}</div>
                  </td>
                  <td className="max-w-[300px] px-4 py-3 text-neutral-600"><span className="line-clamp-2">{l.message}</span></td>
                  <td className="max-w-[220px] px-4 py-3">
                    <div className="truncate text-neutral-700">{l.listing_title}</div>
                    <div className="text-xs text-neutral-400">{naira(l.price)} • {l.location_city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                      l.status === "new" ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-500"
                    }`}>{l.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">{timeAgo(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => messageInquirer(l.sender_id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-500"
                    >
                      <MessageSquare size={13} /> Message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Schedule</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {(data?.inspections ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800">{l.requester_name}</div>
                    <div className="text-xs text-neutral-400">{l.requester_email}</div>
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <div className="truncate text-neutral-700">{l.listing_title}</div>
                    <div className="text-xs text-neutral-400">{l.location_city}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-neutral-600">{l.mode}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">{l.date} • {l.time}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                      l.status === "confirmed" ? "bg-lime-100 text-lime-600"
                      : l.status === "pending" ? "bg-amber-100 text-amber-700"
                      : l.status === "cancelled" ? "bg-red-100 text-red-700"
                      : "bg-neutral-100 text-neutral-500"
                    }`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {l.status === "confirmed" || l.status === "cancelled" ? (
                      <span className="text-xs text-neutral-400">Done</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => decideInspection(l.id, "confirmed")} className="inline-flex items-center gap-1 rounded-lg bg-lime-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-lime-700">
                          <Check size={13} /> Confirm
                        </button>
                        <button onClick={() => decideInspection(l.id, "cancelled")} className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50">
                          <X size={13} /> Decline
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
