/** Shimmering skeleton placeholders used across the marketplace while content loads. */

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-2">
      <div className="skeleton aspect-[292/200] w-full rounded-xl" />
      <div className="space-y-2 px-2 pb-2 pt-3">
        <div className="skeleton h-6 w-2/5 rounded-md" />
        <div className="skeleton h-4 w-4/5 rounded-md" />
        <div className="skeleton h-3.5 w-3/5 rounded-md" />
        <div className="flex gap-1.5 pt-1">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-2">
      <div className="skeleton h-[104px] w-[124px] shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2 py-1.5 pr-2">
        <div className="skeleton h-5 w-2/5 rounded-md" />
        <div className="skeleton h-4 w-4/5 rounded-md" />
        <div className="skeleton h-3.5 w-1/2 rounded-md" />
      </div>
    </div>
  );
}

export function ChipSkeleton() {
  return <div className="skeleton h-[74px] w-[86px] shrink-0 rounded-2xl" />;
}

export function DetailSkeleton() {
  return (
    <div>
      <div className="skeleton h-[320px] w-full rounded-2xl" />
      <div className="mt-5 space-y-3">
        <div className="skeleton h-7 w-3/5 rounded-md" />
        <div className="skeleton h-5 w-2/5 rounded-md" />
        <div className="skeleton h-4 w-full rounded-md" />
        <div className="skeleton h-4 w-5/6 rounded-md" />
      </div>
    </div>
  );
}

export function LineSkeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}
