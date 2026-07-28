"use client";
import { useState } from "react";
import { BellPlus, Check } from "lucide-react";

export function SaveSearchButton({ filters }: {
  filters: { purpose?: string; types?: string[]; minPrice?: number; maxPrice?: number; location?: string };
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const hasFilters = !!(filters.purpose || filters.types?.length || filters.minPrice || filters.maxPrice || filters.location);

  async function save() {
    setErr("");
    const res = await fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "My search", filters }),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error ?? "Could not save."); return; }
    setDone(true);
    setTimeout(() => { setOpen(false); setDone(false); setName(""); }, 1200);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={hasFilters ? "Get notified when new listings match these filters" : "Apply some filters first, then save the search"}
        className="flex h-[34px] items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400"
      >
        <BellPlus size={13} /> Save search
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 text-lime-600"><Check size={22} /></span>
                <p className="h4 mt-3 text-neutral-900">Search saved</p>
                <p className="body-md mt-1 text-neutral-500">We will notify you when new listings match.</p>
              </div>
            ) : (
              <>
                <h3 className="h4 text-neutral-900">Save this search</h3>
                <p className="body-md mt-1 text-neutral-500">
                  {hasFilters
                    ? "You will get a notification whenever a new listing matches your current filters."
                    : "No filters are applied, so this will alert you on every new listing."}
                </p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name it, e.g. 3-bed duplex in Lekki"
                  className="mt-4 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                />
                {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setOpen(false)} className="btn-text h-11 flex-1 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200">Cancel</button>
                  <button onClick={save} className="btn-text h-11 flex-1 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800">Save</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
