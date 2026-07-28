"use client";
import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";

type Review = {
  id: number; rating: number; comment: string | null; created_at: string;
  reviewer_name: string; avatar_color: string;
};

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-[#E2A600] text-[#E2A600]" : "text-neutral-300"}
        />
      ))}
    </span>
  );
}

export function Reviews({ developerId }: { developerId: number }) {
  const [data, setData] = useState<{ reviews: Review[]; average: number | null; count: number } | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch(`/api/reviews?developerId=${developerId}`).then((r) => r.json()).then(setData);
  }, [developerId]);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    setMsg("");
    if (!rating) { setMsg("Pick a star rating first."); return; }
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developerId, rating, comment }),
    });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error ?? "Could not submit."); return; }
    setMsg("Thanks, your review is live.");
    setRating(0); setComment("");
    load();
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="label-lg text-neutral-900">Buyer Reviews</h2>
        {data?.average ? (
          <span className="flex items-center gap-2 text-sm text-neutral-600">
            <Stars value={data.average} /> {data.average.toFixed(1)} • {data.count} review{data.count === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-sm text-neutral-400">No reviews yet</span>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {data?.reviews.length === 0 && (
            <div className="flex h-[140px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-sm text-neutral-400">
              Be the first to review this developer.
            </div>
          )}
          {data?.reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: r.avatar_color }}>
                  {r.reviewer_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{r.reviewer_name}</div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Stars value={r.rating} size={12} />
                    {new Date(r.created_at + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
              {r.comment && <p className="body-md mt-3 text-neutral-600">{r.comment}</p>}
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-900">Leave a review</h3>
          <p className="mt-1 text-xs text-neutral-400">Only share your honest experience with this developer.</p>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)} aria-label={`${i} star`}>
                <Star size={24} className={i <= (hover || rating) ? "fill-[#E2A600] text-[#E2A600]" : "text-neutral-300"} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="How was the process? Documents, communication, delivery…"
            className="mt-3 w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
          {msg && <p className={`mt-2 text-xs ${msg.startsWith("Thanks") ? "text-lime-600" : "text-red-600"}`}>{msg}</p>}
          <button onClick={submit} className="btn-text mt-3 h-11 w-full rounded-xl bg-neutral-950 text-white transition hover:bg-neutral-800">
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
}
