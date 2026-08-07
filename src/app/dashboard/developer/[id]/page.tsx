"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Building2, MessageSquare } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { ListingCard, type Listing } from "@/components/ListingCard";
import { Reviews } from "@/components/dashboard/Reviews";
import { timeAgo } from "@/lib/format";

type Dev = { id: number; full_name: string; avatar_color: string; created_at: string };

export default function DeveloperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<{ developer: Dev; listings: Listing[]; stats: { total: number; verified: number } } | null>(null);

  useEffect(() => {
    fetch(`/api/developers/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  const [msgBusy, setMsgBusy] = useState(false);
  async function message() {
    if (!data || msgBusy) return;
    setMsgBusy(true);
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId: data.developer.id }),
    });
    const d = await res.json().catch(() => ({}));
    setMsgBusy(false);
    if (res.ok && d.id) router.push(`/dashboard/messages?thread=${d.id}`);
    else router.push("/dashboard/messages");
  }

  if (!data?.developer) {
    return (
      <div>
        <Topbar />
        <div className="mt-6 h-[300px] animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }
  const d = data.developer;

  return (
    <div>
      <Topbar crumbs={[["Main", "/dashboard"], ["Developer", ""]]} showRegion={false} />
      <Link href="/dashboard" className="mt-5 inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white md:h-16 md:w-16 md:text-xl" style={{ background: d.avatar_color }}>
              {d.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <span className="truncate">{d.full_name}</span>
                <BadgeCheck size={17} className="shrink-0 text-lime-600" />
              </div>
              <p className="body-md text-neutral-400">
                Verified property developer • Member since {timeAgo(d.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs md:ml-auto md:shrink-0">
            <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-600">
              <Building2 size={12} /> {data.stats.total} active listings
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-lime-100 px-3 py-1 font-medium text-lime-600">
              <BadgeCheck size={12} /> {data.stats.verified} verified
            </span>
          </div>
        </div>

        <button
          onClick={message}
          className="btn-text mt-4 flex h-11 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-900 px-6 text-white transition hover:bg-brand-500 sm:w-auto"
        >
          <MessageSquare size={15} /> Message Developer
        </button>
      </div>

      <h2 className="label-lg mt-8 text-neutral-900">Listings by {d.full_name.split(" ")[0]}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>

      <Reviews developerId={d.id} />
    </div>
  );
}
