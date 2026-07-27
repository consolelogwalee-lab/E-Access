"use client";
import { X, ChevronDown } from "lucide-react";

export type Filters = {
  purpose: string;
  types: string[];
  band: number;
  location: string;
  minLandSize: string;
  verifiedOnly: boolean;
};

export const EMPTY_FILTERS: Filters = {
  purpose: "",
  types: [],
  band: -1,
  location: "",
  minLandSize: "",
  verifiedOnly: false,
};

export const PRICE_BANDS = [
  { label: "Under ₦5M", min: "", max: "5000000" },
  { label: "₦5M – ₦20M", min: "5000000", max: "20000000" },
  { label: "₦20M – ₦50M", min: "20000000", max: "50000000" },
  { label: "₦50M – ₦100M", min: "50000000", max: "100000000" },
  { label: "₦100M – ₦250M", min: "100000000", max: "250000000" },
  { label: "₦250M+", min: "250000000", max: "" },
];

export function FilterDrawer({
  open, onClose, filters, setFilters, onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  onApply: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="absolute inset-y-0 right-0 flex w-full max-w-[426px] flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <h2 className="h4 text-neutral-900">Filters</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6 scroll-thin">
          <div>
            <span className="label-lg mb-3 block text-neutral-900">Listing Purpose</span>
            <div className="grid grid-cols-2 gap-2">
              {[["sale", "For Sale"], ["rent", "For Rent"]].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilters({ ...filters, purpose: filters.purpose === v ? "" : v })}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    filters.purpose === v ? "border-brand-500 bg-brand-500/5 text-brand-500" : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label-lg mb-3 block text-neutral-900">Property Type</span>
            <div className="space-y-2.5">
              {["land", "apartment", "duplex", "commercial"].map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2.5 text-sm capitalize text-neutral-700">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(t)}
                    onChange={() =>
                      setFilters({
                        ...filters,
                        types: filters.types.includes(t) ? filters.types.filter((x) => x !== t) : [...filters.types, t],
                      })
                    }
                    className="h-4 w-4 rounded border-neutral-300 accent-[#0d06a7]"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="label-lg mb-3 block text-neutral-900">Budget</span>
            <div className="flex flex-wrap gap-2">
              {PRICE_BANDS.map((b, i) => (
                <button
                  key={b.label}
                  onClick={() => setFilters({ ...filters, band: filters.band === i ? -1 : i })}
                  className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                    filters.band === i ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label-lg mb-3 block text-neutral-900">Location</span>
            <div className="relative">
              <input
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="All Nigeria"
                className="h-11 w-full rounded-xl bg-neutral-100 px-4 pr-9 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div>
            <span className="label-lg mb-3 block text-neutral-900">Minimum Land Size (sqm)</span>
            <input
              value={filters.minLandSize}
              onChange={(e) => setFilters({ ...filters, minLandSize: e.target.value.replace(/\D/g, "") })}
              placeholder="e.g. 300"
              className="h-11 w-full rounded-xl bg-neutral-100 px-4 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-neutral-200 px-4 py-3.5">
            <span className="text-sm font-medium text-neutral-900">Verified listings only</span>
            <span
              onClick={(e) => { e.preventDefault(); setFilters({ ...filters, verifiedOnly: !filters.verifiedOnly }); }}
              className={`relative h-6 w-11 rounded-full transition ${filters.verifiedOnly ? "bg-brand-500" : "bg-neutral-200"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${filters.verifiedOnly ? "left-[22px]" : "left-0.5"}`} />
            </span>
          </label>
        </div>

        <div className="flex gap-3 border-t border-neutral-100 px-6 py-4">
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="btn-text h-12 flex-1 rounded-xl border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50"
          >
            Clear All
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="btn-text h-12 flex-1 rounded-xl bg-brand-900 text-white transition hover:bg-brand-500"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
