"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Building2, BadgeCheck, Clock3, Inbox, CalendarCheck2 } from "lucide-react";
import { VerificationBadge } from "@/components/Badges";
import { naira, timeAgo } from "@/lib/format";

type Stats = {
  users: number; listings: number; active: number; verified: number; underReview: number;
  inquiries: number; newInquiries: number; inspections: number; pendingInspections: number;
};
type RecentListing = { id: number; title: string; verification_status: string; status: string; price: number; created_at: string };
type RecentUser = { id: number; full_name: string; email: string; role: string; created_at: string };

export default function AdminOverview() {
  const [data, setData] = useState<{ stats: Stats; recentListings: RecentListing[]; recentUsers: RecentUser[] } | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setData);
  }, []);

  if (!data?.stats) return <div className="h-[400px] animate-pulse rounded-2xl bg-white" />;
  const s = data.stats;

  const cards = [
    { icon: Users, label: "Total Users", value: s.users, sub: "registered accounts", href: "/admin/users" },
    { icon: Building2, label: "Listings", value: s.listings, sub: `${s.active} active`, href: "/admin/listings" },
    { icon: BadgeCheck, label: "Verified", value: s.verified, sub: "listings verified", href: "/admin/listings?filter=verified" },
    { icon: Clock3, label: "Under Review", value: s.underReview, sub: "awaiting verification", href: "/admin/verifications" },
    { icon: Inbox, label: "Leads", value: s.inquiries, sub: `${s.newInquiries} new`, href: "/admin/leads" },
    { icon: CalendarCheck2, label: "Inspections", value: s.inspections, sub: `${s.pendingInspections} pending`, href: "/admin/leads" },
  ];

  return (
    <div>
      <h1 className="h3 text-neutral-900">Admin Overview</h1>
      <p className="body-md text-neutral-400">Platform health at a glance.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-400">
            <c.icon size={17} className="text-neutral-400" />
            <div className="mt-3 text-2xl font-bold text-neutral-900">{c.value}</div>
            <div className="text-xs font-medium text-neutral-700">{c.label}</div>
            <div className="text-[11px] text-neutral-400">{c.sub}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="label-lg text-neutral-900">Recent Listings</h2>
            <Link href="/admin/listings" className="text-xs font-medium text-support-blue hover:underline">View all</Link>
          </div>
          <div className="mt-3 divide-y divide-neutral-100">
            {data.recentListings.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-800">{l.title}</div>
                  <div className="text-xs text-neutral-400">{naira(l.price)} • {timeAgo(l.created_at)}</div>
                </div>
                <VerificationBadge status={l.verification_status} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="label-lg text-neutral-900">Recent Users</h2>
            <Link href="/admin/users" className="text-xs font-medium text-support-blue hover:underline">View all</Link>
          </div>
          <div className="mt-3 divide-y divide-neutral-100">
            {data.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-800">{u.full_name}</div>
                  <div className="truncate text-xs text-neutral-400">{u.email} • {timeAgo(u.created_at)}</div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                  u.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-500"
                }`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
