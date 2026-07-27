import { NextResponse } from "next/server";
import { run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const prefs = await req.json();
  await run("UPDATE users SET preferences_json = $1 WHERE id = $2", [JSON.stringify(prefs), user.id]);
  return NextResponse.json({ ok: true });
}
