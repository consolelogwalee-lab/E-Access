import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const documents = await q(
    `SELECT d.*, l.title AS listing_title, l.estate_name, l.location_area, l.location_city, l.image_seed
     FROM listing_documents d
     JOIN listings l ON l.id = d.listing_id
     WHERE l.owner_id = $1
     ORDER BY d.uploaded_at DESC, d.id DESC`,
    [user.id]
  );
  return NextResponse.json({ documents });
}
