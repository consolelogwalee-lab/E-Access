"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";

const BUDGETS = [
  ["", "Any Price"],
  ["0-10000000", "Below ₦10m"],
  ["10000000-50000000", "₦10m – ₦50m"],
  ["50000000-150000000", "₦50m – ₦150m"],
  ["150000000-", "Above ₦150m"],
] as const;

export function HeroSearch({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [purpose, setPurpose] = useState<"sale" | "rent">("sale");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");

  function explore() {
    const p = new URLSearchParams();
    p.set("purpose", purpose);
    if (location) p.set("location", location);
    if (type) p.set("type", type);
    if (budget) {
      const [min, max] = budget.split("-");
      if (min) p.set("minPrice", min);
      if (max) p.set("maxPrice", max);
    }
    router.push(`/explore?${p.toString()}`);
  }

  return (
    <div className={`rounded-2xl border p-3 shadow-lg shadow-neutral-900/5 ${dark ? "border-white/10 bg-neutral-900" : "border-neutral-200 bg-white"}`}>
      <div className="flex items-center justify-between pb-3">
        <div className={`flex rounded-full p-0.5 ${dark ? "bg-white/10" : "bg-neutral-100"}`}>
          {(["sale", "rent"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPurpose(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                purpose === p
                  ? dark ? "bg-white text-neutral-900" : "bg-white text-neutral-900 shadow-sm"
                  : dark ? "text-white/60" : "text-neutral-500"
              }`}
            >
              {p === "sale" ? "Buy" : "Rent"}
            </button>
          ))}
        </div>
        <LayoutGrid size={18} className={dark ? "text-white/40" : "text-neutral-300"} />
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="block">
          <span className={`caption mb-1.5 block ${dark ? "text-white/60" : "text-neutral-500"}`}>Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && explore()}
            placeholder="Search by city or area"
            className={`h-11 w-full rounded-xl px-4 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/40 ${
              dark ? "bg-white/10 text-white placeholder-white/40" : "bg-neutral-100 text-neutral-900 placeholder-neutral-400"
            }`}
          />
        </label>
        <label className="relative block">
          <span className={`caption mb-1.5 block ${dark ? "text-white/60" : "text-neutral-500"}`}>Property Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`h-11 w-full appearance-none rounded-xl px-4 pr-9 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/40 ${
              dark ? "bg-white/10 text-white" : "bg-neutral-100 text-neutral-900"
            }`}
          >
            <option value="">Any type</option>
            <option value="apartment">Apartment</option>
            <option value="land">Land</option>
            <option value="duplex">Duplex</option>
            <option value="commercial">Commercial</option>
          </select>
          <ChevronDown size={16} className={`pointer-events-none absolute right-3 top-[38px] ${dark ? "text-white/50" : "text-neutral-400"}`} />
        </label>
        <label className="relative block">
          <span className={`caption mb-1.5 block ${dark ? "text-white/60" : "text-neutral-500"}`}>Budget</span>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={`h-11 w-full appearance-none rounded-xl px-4 pr-9 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/40 ${
              dark ? "bg-white/10 text-white" : "bg-neutral-100 text-neutral-900"
            }`}
          >
            {BUDGETS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown size={16} className={`pointer-events-none absolute right-3 top-[38px] ${dark ? "text-white/50" : "text-neutral-400"}`} />
        </label>
        <div className="flex items-end">
          <button
            onClick={explore}
            className="btn-text h-11 w-full rounded-xl bg-brand-900 px-10 text-white transition hover:bg-brand-500 md:w-auto"
          >
            Explore
          </button>
        </div>
      </div>
    </div>
  );
}
