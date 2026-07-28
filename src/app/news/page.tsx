import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { LogoFull } from "@/components/Logo";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

type Post = {
  id: number; title: string; category: string; body: string;
  video_url: string | null; cover_image: string | null; author_name: string; created_at: string;
};

const CATEGORY_STYLES: Record<string, string> = {
  news: "bg-blue-50 text-blue-700",
  offer: "bg-amber-50 text-amber-700",
  opportunity: "bg-lime-50 text-lime-700",
  update: "bg-purple-50 text-purple-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  news: "Market News",
  offer: "Offer",
  opportunity: "Opportunity",
  update: "Platform Update",
};

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const params: unknown[] = [];
  let where = "published = 1";
  if (category && CATEGORY_LABELS[category]) {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }
  const posts = (await q(`SELECT * FROM posts WHERE ${where} ORDER BY created_at DESC, id DESC`, params)) as unknown as Post[];
  const [featured, ...rest] = posts;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-[1120px] px-6 pb-20 pt-28">
        <span className="text-sm font-extrabold uppercase tracking-[0.25em] text-[#E2A600]">Info Center</span>
        <h1 className="display mt-3 text-[34px] leading-[1.15] text-neutral-950 md:text-[46px]">
          News, Offers and Opportunities
        </h1>
        <p className="body-lg mt-3 max-w-[560px] text-neutral-500">
          Real estate news, market insights, platform updates and limited offers from the E-Access team.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/news"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${!category ? "bg-neutral-950 text-white" : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}
          >
            All
          </Link>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={`/news?category=${key}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${category === key ? "bg-neutral-950 text-white" : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <p className="body-lg mt-16 text-neutral-400">Nothing published in this category yet. Check back soon.</p>
        ) : (
          <>
            {featured && (
              <Link href={`/news/${featured.id}`} className="group mt-10 grid gap-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white transition hover:shadow-xl hover:shadow-neutral-900/5 md:grid-cols-2">
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/photos/${featured.cover_image ?? "estate-aerial.jpg"}`}
                    alt=""
                    className="h-full min-h-[260px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-col justify-center p-8">
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_STYLES[featured.category] ?? "bg-neutral-100 text-neutral-600"}`}>
                    {CATEGORY_LABELS[featured.category] ?? featured.category}
                  </span>
                  <h2 className="mt-4 text-[24px] font-semibold leading-8 text-neutral-900 md:text-[28px] md:leading-9">
                    {featured.title}
                  </h2>
                  <p className="body-md mt-3 line-clamp-3 text-neutral-500">{featured.body}</p>
                  <span className="mt-5 text-xs text-neutral-400">
                    {featured.author_name} • {new Date(featured.created_at + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </Link>
            )}

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link key={p.id} href={`/news/${p.id}`} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-900/5">
                  <div className="overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/photos/${p.cover_image ?? "estate-street.jpg"}`}
                      alt=""
                      className="aspect-[380/210] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-5">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${CATEGORY_STYLES[p.category] ?? "bg-neutral-100 text-neutral-600"}`}>
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </span>
                    <h3 className="mt-3 line-clamp-2 text-[17px] font-semibold leading-6 text-neutral-900">{p.title}</h3>
                    <p className="body-md mt-2 line-clamp-2 text-neutral-500">{p.body}</p>
                    <span className="mt-4 block text-xs text-neutral-400">
                      {new Date(p.created_at + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <footer className="bg-[#04040a] py-10 text-center">
        <div className="flex justify-center"><LogoFull /></div>
        <p className="mt-4 text-xs text-white/40">© 2026 E-Access. All rights reserved.</p>
      </footer>
    </main>
  );
}
