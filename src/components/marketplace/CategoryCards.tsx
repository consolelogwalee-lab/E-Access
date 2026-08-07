"use client";

const CATEGORIES = [
  { key: "", label: "All", img: "/photos/estate-aerial.jpg" },
  { key: "land", label: "Land", img: "/photos/land-1.jpg" },
  { key: "apartment", label: "Apartment", img: "/photos/apartment-1.jpg" },
  { key: "duplex", label: "Duplex", img: "/photos/duplex-1.jpg" },
  { key: "commercial", label: "Commercial", img: "/photos/commercial-1.jpg" },
];

/** Image-led category tiles (replaces the plain icon chips). */
export function CategoryCards({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scroll-thin">
      {CATEGORIES.map((c) => {
        const on = value === c.key;
        return (
          <button
            key={c.key || "all"}
            onClick={() => onChange(c.key)}
            className={`group relative h-[92px] w-[104px] shrink-0 overflow-hidden rounded-2xl border transition ${
              on ? "border-brand-900 ring-2 ring-brand-900/30" : "border-neutral-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            <div className={`absolute inset-0 transition ${on ? "bg-brand-900/45" : "bg-black/30 group-hover:bg-black/40"}`} />
            <span className="absolute inset-x-0 bottom-0 p-2 text-left text-[13px] font-bold text-white drop-shadow">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
