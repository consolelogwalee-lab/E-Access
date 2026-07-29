/**
 * Supabase Storage, server-side only.
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the environment.
 * When they are not set (e.g. local dev without keys), storage is disabled and
 * flows gracefully fall back to name-only records, exactly as before.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const BUCKET_PUBLIC = "listing-media";
export const BUCKET_DOCS = "documents";

export function storageEnabled(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

function headers(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY, ...extra };
}

/** Uploads a file buffer. Returns the storage path on success, null on failure. */
export async function uploadFile(
  bucket: string,
  path: string,
  data: ArrayBuffer,
  contentType: string
): Promise<string | null> {
  if (!storageEnabled()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: headers({ "Content-Type": contentType, "x-upsert": "true" }),
      body: data,
    });
    if (!res.ok) return null;
    return path;
  } catch {
    return null;
  }
}

/** Public URL for files in the public bucket. */
export function publicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_PUBLIC}/${path}`;
}

/** Short-lived signed URL for private documents. Null on failure. */
export async function signedUrl(path: string, expiresIn = 600): Promise<string | null> {
  if (!storageEnabled()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET_DOCS}/${path}`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn }),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { signedURL?: string };
    return d.signedURL ? `${SUPABASE_URL}/storage/v1${d.signedURL}` : null;
  } catch {
    return null;
  }
}

/** Sanitizes a client file name into a safe storage segment. */
export function safeName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
  return `${Date.now()}_${base}`;
}
