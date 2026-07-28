import Link from "next/link";
import { BadgeCheck, Building2, Phone, Star } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { LogoFull } from "@/components/Logo";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

type Agent = {
  id: number; user_id: number; agency_name: string; whatsapp: string | null; phone: string;
  bio: string | null; areas: string | null; created_at: string; full_name: string; avatar_color: string;
  listing_count: number | string; rating: number | string | null;
};

export default async function AgentsPage() {
  const agents = (await q(
    `SELECT a.id, a.user_id, a.agency_name, a.whatsapp, a.phone, a.bio, a.areas, a.created_at,
            u.full_name, u.avatar_color,
            (SELECT COUNT(*) FROM listings l WHERE l.owner_id = a.user_id AND l.status = 'active') AS listing_count,
            (SELECT AVG(r.rating) FROM reviews r WHERE r.developer_id = a.user_id) AS rating
     FROM agents a JOIN users u ON u.id = a.user_id
     WHERE a.status = 'approved' ORDER BY a.id DESC`
  )) as unknown as Agent[];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-[1120px] px-6 pb-20 pt-28">
        <span className="text-sm font-extrabold uppercase tracking-[0.25em] text-[#E2A600]">Verified Network</span>
        <h1 className="display mt-3 text-[34px] leading-[1.15] text-neutral-950 md:text-[46px]">Verified Agents & Realtors</h1>
        <p className="body-lg mt-3 max-w-[560px] text-neutral-500">
          Every agent here has been identity-checked and verified by the E-Access team. Work with people who have a reputation to protect.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/agent" className="btn-gold flex h-11 items-center rounded-xl px-6 text-[14px]">
            Become a verified agent
          </Link>
        </div>

        {agents.length === 0 ? (
          <p className="body-lg mt-16 text-neutral-400">The first verified agents are being onboarded. Check back soon.</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <div key={a.id} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-900/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: a.avatar_color }}>
                    {a.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[15px] font-semibold text-neutral-900">
                      <span className="truncate">{a.agency_name}</span>
                      <BadgeCheck size={15} className="shrink-0 text-lime-600" />
                    </div>
                    <div className="truncate text-xs text-neutral-400">{a.full_name}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-600">
                    <Building2 size={11} /> {a.listing_count} listings
                  </span>
                  {a.rating ? (
                    <span className="flex items-center gap-1 rounded-full bg-[#E2A600]/10 px-2.5 py-1 font-semibold text-[#8a6a00]">
                      <Star size={11} className="fill-[#E2A600] text-[#E2A600]" /> {Number(a.rating).toFixed(1)}
                    </span>
                  ) : null}
                </div>
                {a.areas && <p className="mt-2 text-xs text-neutral-500">Covers: {a.areas}</p>}
                {a.bio && <p className="body-md mt-2 line-clamp-3 flex-1 text-neutral-600">{a.bio}</p>}
                <div className="mt-4 flex gap-2">
                  {a.whatsapp && (
                    <a
                      href={`https://wa.me/${a.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I found you on E-Access.")}`}
                      target="_blank" rel="noreferrer"
                      className="btn-text flex h-10 flex-1 items-center justify-center rounded-xl bg-[#25D366] text-white transition hover:brightness-105"
                    >
                      WhatsApp
                    </a>
                  )}
                  <a href={`tel:${a.phone}`} className="btn-text flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-neutral-800 transition hover:bg-neutral-50">
                    <Phone size={13} /> Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <footer className="bg-[#04040a] py-10 text-center">
        <div className="flex justify-center"><LogoFull /></div>
        <p className="mt-4 text-xs text-white/40">© 2026 E-Access. All rights reserved.</p>
      </footer>
    </main>
  );
}
