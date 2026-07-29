import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { BUCKET_DOCS, BUCKET_PUBLIC, publicUrl, safeName, storageEnabled, uploadFile } from "@/lib/storage";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_TYPES = [...IMAGE_TYPES, "application/pdf"];

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!storageEnabled())
    return NextResponse.json({ ok: false, disabled: true, error: "File storage is not configured yet." }, { status: 200 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "document");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });

  const isPhoto = kind === "photo";
  const allowed = isPhoto ? IMAGE_TYPES : DOC_TYPES;
  if (!allowed.includes(file.type))
    return NextResponse.json({ error: isPhoto ? "Only JPG, PNG or WebP images are allowed." : "Only PDF, JPG, PNG or WebP files are allowed." }, { status: 400 });
  const maxBytes = isPhoto ? 10 * 1024 * 1024 : 15 * 1024 * 1024;
  if (file.size > maxBytes)
    return NextResponse.json({ error: `File is too large. Keep it under ${isPhoto ? 10 : 15}MB.` }, { status: 400 });

  const bucket = isPhoto ? BUCKET_PUBLIC : BUCKET_DOCS;
  const path = `u${user.id}/${safeName(file.name)}`;
  const stored = await uploadFile(bucket, path, await file.arrayBuffer(), file.type);
  if (!stored) return NextResponse.json({ error: "Upload failed. Try again." }, { status: 502 });

  return NextResponse.json({
    ok: true,
    path: stored,
    fileName: file.name,
    url: isPhoto ? publicUrl(stored) : null,
  });
}
