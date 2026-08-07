import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

/**
 * Client response to an "action required" validation request.
 * The owner may add documents/photos, remove files, and leave a short note,
 * then send the request back to the verification team.
 * Only allowed while the request is in the action_required state.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const reqId = Number(id);

  const v = await q1<{ id: number; user_id: number; reference: string; status: string }>(
    "SELECT * FROM validation_requests WHERE id = $1", [reqId]
  );
  if (!v) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (Number(v.user_id) !== user.id) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (v.status !== "action_required")
    return NextResponse.json({ error: "This request is not awaiting changes from you." }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const note = b.note ? String(b.note).slice(0, 500).trim() : "";
  const removeIds: number[] = Array.isArray(b.removeIds) ? b.removeIds.map(Number).filter(Boolean) : [];
  const documents = Array.isArray(b.documents) ? b.documents : [];
  const photos = Array.isArray(b.photos) ? b.photos : [];

  // ---- Validate everything BEFORE touching any row, so a rejected
  // ---- request can never leave the submission partially destroyed.
  const owned = await q<{ id: number; kind: string }>(
    "SELECT id, kind FROM validation_files WHERE request_id = $1", [reqId]
  );
  const ownedById = new Map(owned.map((f) => [Number(f.id), String(f.kind)]));
  const toRemove = [...new Set(removeIds)].filter((fid) => ownedById.has(fid)).slice(0, 50);

  const validDocs = documents.slice(0, 12).filter((d: { fileName?: string; storagePath?: string | null }) =>
    (typeof d === "string" ? d : d?.fileName) && (typeof d === "string" ? null : d?.storagePath));
  const validPhotos = photos.slice(0, 12).filter((p: { fileName?: string; storagePath?: string | null }) =>
    (typeof p === "string" ? p : p?.fileName) && (typeof p === "string" ? null : p?.storagePath));

  const currentDocCount = owned.filter((f) => f.kind === "document").length;
  const removedDocCount = toRemove.filter((fid) => ownedById.get(fid) === "document").length;
  if (currentDocCount - removedDocCount + validDocs.length === 0)
    return NextResponse.json({ error: "Keep at least one property document on the request." }, { status: 400 });

  const added = validDocs.length + validPhotos.length;
  if (added === 0 && toRemove.length === 0 && !note)
    return NextResponse.json({ error: "Add a file or a note before sending this back." }, { status: 400 });

  // ---- Validated: now apply the changes.
  for (const fid of toRemove) {
    await run("DELETE FROM validation_files WHERE id = $1 AND request_id = $2", [fid, reqId]);
  }
  for (const d of validDocs) {
    await run(
      "INSERT INTO validation_files (request_id, kind, doc_type, file_name, storage_path) VALUES ($1,'document',$2,$3,$4)",
      [reqId, String(d.docType ?? "Supporting Document").slice(0, 80), String(d.fileName).slice(0, 160), d.storagePath]
    );
  }
  for (const p of validPhotos) {
    await run(
      "INSERT INTO validation_files (request_id, kind, file_name, storage_path) VALUES ($1,'photo',$2,$3)",
      [reqId, String(p.fileName).slice(0, 160), p.storagePath]
    );
  }

  const removeIdsLen = toRemove.length;
  const summary = [
    added > 0 ? `${added} file${added === 1 ? "" : "s"} added` : "",
    removeIdsLen > 0 ? `${removeIdsLen} removed` : "",
  ].filter(Boolean).join(", ");
  const eventNote = note || (summary ? `Documents updated by the client (${summary}).` : "Sent back for review.");

  await run("UPDATE validation_requests SET status = 'in_review', admin_note = NULL WHERE id = $1", [reqId]);
  await run("INSERT INTO validation_events (request_id, status, note, actor) VALUES ($1,'resubmitted',$2,'you')",
    [reqId, summary && note ? `${note} (${summary})` : eventNote]);

  const admins = await q<{ id: number }>("SELECT id FROM users WHERE role = 'admin'");
  for (const a of admins) {
    if (Number(a.id) === user.id) continue;
    await notify(Number(a.id), "verification", `${v.reference} updated by the client`,
      `${user.full_name} responded to the changes requested on ${v.reference}.`, "/admin/validations");
  }

  return NextResponse.json({ ok: true });
}
