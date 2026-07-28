import { NextResponse } from "next/server";
import { q, q1 } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const request = await q1<{ id: number; user_id: number }>(
    "SELECT * FROM validation_requests WHERE id = $1", [Number(id)]
  );
  if (!request) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (Number(request.user_id) !== user.id && user.role !== "admin")
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const files = await q("SELECT * FROM validation_files WHERE request_id = $1 ORDER BY id", [Number(id)]);
  const events = await q("SELECT * FROM validation_events WHERE request_id = $1 ORDER BY id", [Number(id)]);
  const owner = await q1("SELECT full_name, email FROM users WHERE id = $1", [Number(request.user_id)]);
  return NextResponse.json({ request, files, events, owner });
}
