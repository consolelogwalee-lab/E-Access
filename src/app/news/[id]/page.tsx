import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { LogoFull } from "@/components/Logo";
import { q1, q } from "@/lib/db";

export const dynamic = "force-dynamic";

type Post = {
  id: number; title: string; category: string; body: string;
  video_url: string | null; cover_image: string | null; author_name: string; created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  news: "Market News", offer: "Offer", opportunity: "Opportunity", update: "Platform Update",
};

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = (await q1("SELECT * FROM posts WHERE id = $1 AND published = 1", [Number(id)])) as Post | null;
  if (!post) notFound();
  const more = (await q(
    "SELECT id, title, category, cover_image, created_at FROM posts WHERE published = 1 AND id != $1 ORDER BY created_at DESC LIMIT 3",
    [post.id]
  )) as unknown as Post[];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <article className="mx-auto max-w-[760px] px-6 pb-20 pt-28">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900">
          <ArrowLeft size={15} /> Back to Info Center
        </Link>
        <span className="mt-6 block text-xs font-bold uppercase tracking-[0.2em] text-[#E2A600]">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>
        <h1 className="display mt-3 text-[30px] leading-[1.2] text-neutral-950 md:text-[40px]">{post.title}</h1>
        <div className="mt-4 text-sm text-neutral-400">
          {post.author_name} • {new Date(post.created_at + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </div>

        {post.video_url ? (
          <div className="mt-8 overflow-hidden rounded-2xl bg-black">
            <iframe
              src={post.video_url}
              title={post.title}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : post.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/photos/${post.cover_image}`} alt="" className="mt-8 w-full rounded-2xl object-cover" />
        ) : null}

        <div className="mt-8 space-y-5">
          {post.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-[16.5px] leading-[1.8] text-neutral-700">{para}</p>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-[#04040a] p-8 text-center text-white">
          <h3 className="display text-[22px]">Ready to find verified property?</h3>
          <p className="body-md mt-2 text-white/60">Every listing on E-Access passes document and developer verification.</p>
          <Link href="/#browse" className="btn-text mt-5 inline-block rounded-full bg-[#E2A600] px-6 py-3 text-[#3f3005] transition hover:brightness-105">
            Browse listings
          </Link>
        </div>
      </article>

      {more.length > 0 && (
        <div className="mx-auto max-w-[1120px] border-t border-neutral-100 px-6 py-14">
          <h2 className="h3 text-neutral-900">More from the Info Center</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {more.map((p) => (
              <Link key={p.id} href={`/news/${p.id}`} className="group overflow-hidden rounded-2xl border border-neutral-200 transition hover:shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/photos/${p.cover_image ?? "estate-street.jpg"}`} alt="" className="aspect-[380/200] w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                <div className="p-4">
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-5 text-neutral-900">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <footer className="bg-[#04040a] py-10 text-center">
        <div className="flex justify-center"><LogoFull /></div>
        <p className="mt-4 text-xs text-white/40">© 2026 E-Access. All rights reserved.</p>
      </footer>
    </main>
  );
}
