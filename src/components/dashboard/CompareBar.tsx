"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Scale, X } from "lucide-react";
import { getCompare, clearCompare, COMPARE_EVENT } from "@/lib/compare";

export function CompareBar() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setIds(getCompare());
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    return () => window.removeEventListener(COMPARE_EVENT, sync);
  }, []);

  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-neutral-950 py-2 pl-5 pr-2 text-white shadow-2xl shadow-black/30 lg:ml-[143px]">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Scale size={15} className="text-[#E2A600]" />
        {ids.length} propert{ids.length === 1 ? "y" : "ies"} selected
      </span>
      <Link
        href="/dashboard/compare"
        className={`btn-text rounded-full px-4 py-2 transition ${
          ids.length >= 2
            ? "bg-[#E2A600] text-[#3f3005] hover:brightness-105"
            : "pointer-events-none bg-white/10 text-white/40"
        }`}
      >
        Compare{ids.length < 2 ? " (pick 2+)" : ""}
      </Link>
      <button
        onClick={clearCompare}
        aria-label="Clear comparison"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
      >
        <X size={15} />
      </button>
    </div>
  );
}
