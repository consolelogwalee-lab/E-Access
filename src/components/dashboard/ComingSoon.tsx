import { Topbar } from "@/components/dashboard/Topbar";

export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div>
      <Topbar />
      <h1 className="h3 mt-6 text-neutral-900">{title}</h1>
      <div className="mt-6 flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-center">
        <p className="h4 text-neutral-700">Coming in the next build pass</p>
        <p className="body-md mt-1 max-w-[380px] text-neutral-400">{note}</p>
      </div>
    </div>
  );
}
