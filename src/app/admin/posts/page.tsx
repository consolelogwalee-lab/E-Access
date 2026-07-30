"use client";
import { useCallback, useEffect, useState } from "react";
import { Newspaper, Pencil, Plus, Trash2, Video, X } from "lucide-react";
import { appConfirm } from "@/components/Ui";

type Post = {
  id: number; title: string; category: string; body: string;
  video_url: string | null; cover_image: string | null; published: number;
  author_name: string; created_at: string;
};

const CATEGORIES = [
  ["news", "Market News"], ["offer", "Offer"], ["opportunity", "Opportunity"], ["update", "Platform Update"],
] as const;

const COVERS = [
  "estate-aerial.jpg", "land-4.jpg", "duplex-6.jpg", "duplex-10.jpg", "apartment-6.jpg",
  "howitworks.jpg", "estate-street.jpg", "hero-1.jpg", "hero-2.jpg", "hero-3.jpg", "whyus.jpg", "footer-aerial.jpg",
];

const EMPTY = { title: "", category: "news", body: "", videoUrl: "", coverImage: "estate-aerial.jpg", published: true };

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [editing, setEditing] = useState<null | { id?: number; title: string; category: string; body: string; videoUrl: string; coverImage: string; published: boolean }>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    fetch("/api/posts?all=1").then((r) => r.json()).then((d) => setPosts(d.posts ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!editing) return;
    setSaving(true); setErr("");
    const res = await fetch(editing.id ? `/api/posts/${editing.id}` : "/api/posts", {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setErr(d.error ?? "Could not save."); return; }
    setEditing(null);
    load();
  }

  async function remove(id: number) {
    if (!(await appConfirm("Delete this post? This cannot be undone.", "Delete post"))) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h3 text-neutral-900">Info Center</h1>
          <p className="body-md mt-1 text-neutral-500">Publish news, offers, opportunities and updates. Posts appear on the public News page.</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="btn-text flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-white transition hover:bg-neutral-800"
        >
          <Plus size={15} /> New Post
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {posts === null && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
        {posts?.length === 0 && (
          <div className="flex h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60">
            <Newspaper size={28} className="text-neutral-300" />
            <p className="body-md mt-3 text-neutral-400">No posts yet. Create the first one.</p>
          </div>
        )}
        {posts?.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/photos/${p.cover_image ?? "estate-street.jpg"}`} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-neutral-900">{p.title}</span>
                {p.video_url && <Video size={13} className="shrink-0 text-neutral-400" />}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
                <span className="capitalize">{p.category}</span>
                <span>•</span>
                <span>{new Date(p.created_at + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                {!p.published && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">Draft</span>}
              </div>
            </div>
            <button
              onClick={() => setEditing({ id: p.id, title: p.title, category: p.category, body: p.body, videoUrl: p.video_url ?? "", coverImage: p.cover_image ?? "estate-street.jpg", published: !!p.published })}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
              aria-label="Edit post"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => remove(p.id)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100"
              aria-label="Delete post"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-[2px]" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl scroll-thin" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="h4 text-neutral-900">{editing.id ? "Edit Post" : "New Post"}</h2>
              <button onClick={() => setEditing(null)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100" aria-label="Close">
                <X size={17} />
              </button>
            </div>

            <label className="mt-5 block text-xs font-semibold text-neutral-500">Title</label>
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              placeholder="e.g. New estate launch in Epe with early-bird pricing"
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-500">Category</label>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
                >
                  {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500">Cover image</label>
                <select
                  value={editing.coverImage}
                  onChange={(e) => setEditing({ ...editing, coverImage: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
                >
                  {COVERS.map((c) => <option key={c} value={c}>{c.replace(".jpg", "").replace(/-/g, " ")}</option>)}
                </select>
              </div>
            </div>

            <label className="mt-4 block text-xs font-semibold text-neutral-500">Video URL (optional, YouTube embed link)</label>
            <input
              value={editing.videoUrl}
              onChange={(e) => setEditing({ ...editing, videoUrl: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              placeholder="https://www.youtube.com/embed/VIDEO_ID"
            />
            <p className="mt-1 text-[11px] text-neutral-400">On YouTube: Share → Embed, then copy the src link. The video plays at the top of the post.</p>

            <label className="mt-4 block text-xs font-semibold text-neutral-500">Body</label>
            <textarea
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              rows={8}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              placeholder="Write the post. Separate paragraphs with a blank line."
            />

            <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                className="h-4 w-4 accent-neutral-950"
              />
              Published (visible to everyone)
            </label>

            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditing(null)} className="btn-text h-12 flex-1 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-text h-12 flex-1 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 disabled:opacity-50">
                {saving ? "Saving…" : editing.id ? "Save changes" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
