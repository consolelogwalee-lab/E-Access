"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

/**
 * Property photo gallery.
 * Mobile: a swipeable track, one photo at a time, with dots and a counter.
 * Desktop: the mosaic, with every tile clickable.
 * Both open a fullscreen viewer (swipe, arrows, keyboard, Esc).
 *
 * The counter always reflects photos that are actually viewable, never a
 * hard-coded number.
 */
export function PhotoGallery({ photos, alt, verified }: { photos: string[]; alt: string; verified?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const count = photos.length;
  const go = useCallback((n: number) => setIdx(((n % count) + count) % count), [count]);
  const viewerGo = useCallback((n: number) => setViewer((v) => (v === null ? v : ((n % count) + count) % count)), [count]);

  // Keyboard + body scroll lock while the viewer is open
  useEffect(() => {
    if (viewer === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      if (e.key === "ArrowRight") viewerGo(viewer + 1);
      if (e.key === "ArrowLeft") viewerGo(viewer - 1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [viewer, viewerGo]);

  if (count === 0) return null;

  function onTouchStart(e: React.TouchEvent) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent, current: number, move: (n: number) => void) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    move(dx < 0 ? current + 1 : current - 1);
  }

  return (
    <>
      <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_190px]">
        {/* ---- Mobile: swipeable track. Desktop: single hero. ---- */}
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-300 ease-out lg:hidden"
            style={{ transform: `translateX(-${idx * 100}%)` }}
            onTouchStart={onTouchStart}
            onTouchEnd={(e) => onTouchEnd(e, idx, go)}
          >
            {photos.map((src, i) => (
              <button
                key={i}
                onClick={() => setViewer(i)}
                className="relative block h-[320px] w-full shrink-0"
                aria-label={`Open photo ${i + 1} of ${count}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={i === 0 ? alt : ""} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <button onClick={() => setViewer(0)} className="hidden w-full lg:block" aria-label="Open photo viewer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt={alt} className="h-[512px] w-full object-cover" />
          </button>

          {/* Badges */}
          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2">
            <span className="rounded-full bg-neutral-950/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              <span className="lg:hidden">{idx + 1} / {count}</span>
              <span className="hidden lg:inline">{count} Photo{count === 1 ? "" : "s"}</span>
            </span>
            {verified && (
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800">
                <BadgeCheck size={13} className="text-lime-600" /> Verified Listing
              </span>
            )}
          </div>

          {/* Dots (mobile) */}
          {count > 1 && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 lg:hidden">
              {photos.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
          )}

          {/* Arrows (desktop) */}
          {count > 1 && (
            <>
              <button onClick={() => setViewer(count - 1)} aria-label="Previous photo" className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow transition hover:bg-white lg:flex">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setViewer(1)} aria-label="Next photo" className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow transition hover:bg-white lg:flex">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* ---- Desktop thumbnail rail ---- */}
        <div className="hidden flex-col gap-2 lg:flex">
          {[1, 2].map((k) =>
            photos[k] ? (
              <button key={k} onClick={() => setViewer(k)} className="overflow-hidden rounded-xl" aria-label={`Open photo ${k + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[k]} alt="" className="h-[165px] w-full object-cover transition duration-300 hover:scale-[1.03]" />
              </button>
            ) : null
          )}
          {count > 3 && (
            <button onClick={() => setViewer(3)} className="relative h-[165px] overflow-hidden rounded-xl" aria-label="See all photos">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[3]} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-neutral-950/55 text-sm font-semibold text-white">
                <Expand size={15} /> {count - 3} more
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ---- Fullscreen viewer ---- */}
      {viewer !== null && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-neutral-950/95 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">{viewer + 1} of {count}</span>
            <button onClick={() => setViewer(null)} aria-label="Close photo viewer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
              <X size={20} />
            </button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden px-2"
            onTouchStart={onTouchStart}
            onTouchEnd={(e) => onTouchEnd(e, viewer, viewerGo)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[viewer]} alt={`${alt} photo ${viewer + 1}`} className="max-h-full max-w-full object-contain" />
            {count > 1 && (
              <>
                <button onClick={() => viewerGo(viewer - 1)} aria-label="Previous photo" className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => viewerGo(viewer + 1)} aria-label="Next photo" className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {count > 1 && (
            <div className="scroll-thin flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
              {photos.map((src, i) => (
                <button key={i} onClick={() => setViewer(i)} className={`shrink-0 overflow-hidden rounded-lg transition ${i === viewer ? "ring-2 ring-white" : "opacity-50 hover:opacity-100"}`} aria-label={`Photo ${i + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-14 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
