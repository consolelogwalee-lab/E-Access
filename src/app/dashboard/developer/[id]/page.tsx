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

  async function message() {
    if (!data) return;
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ counterpartName: data.developer.full_name, role: "developer" }),
    });
    if (res.ok) router.push("/dashboard/messages");
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

      <div className="mt-5 flex flex-wrap items-center gap-5 rounded-2xl border border-neutral-200 bg-white p-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white" style={{ background: d.avatar_color }}>
          {d.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
            {d.full_name} <BadgeCheck size={17} className="text-lime-600" />
          </div>
          <p className="body-md text-neutral-400">
            Verified property developer • Member since {timeAgo(d.created_at).replace(" ago", "")} ago
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-600">
              <Building2 size={12} /> {data.stats.total} active listings
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-lime-100 px-3 py-1 font-medium text-lime-600">
              <BadgeCheck size={12} /> {data.stats.verified} verified
            </span>
          </div>
        </div>
        <button onClick={message} className="btn-text flex h-11 items-center gap-2 rounded-xl bg-brand-900 px-6 text-white transition hover:bg-brand-500">
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
