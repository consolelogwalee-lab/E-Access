import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const DEMO_CONSULTANTS: [string, string][] = [
  ["Julius Ogunni", "consultant"],
  ["Daniel Doe", "developer"],
  ["Emily Smith", "consultant"],
  ["Michael Brown", "consultant"],
  ["Sophia Johnson", "consultant"],
];

const DEMO_OPENERS: Record<string, string> = {
  "Julius Ogunni": "Hope you liked it? Can't wait to hear your thoughts on the estate tour.",
  "Emily Smith": "Schedule a meeting this week so we can review the survey documents together.",
  "Michael Brown": "Thanks very much for the quick turnaround on the inspection request.",
  "Sophia Johnson": "Review the proposal that I sent across when you have a moment.",
};

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const existing = await q1<{ c: number | string }>("SELECT COUNT(*) AS c FROM threads WHERE user_id = $1", [user.id]);
  if (!Number(existing?.c ?? 0)) {
    for (const [name, role] of DEMO_CONSULTANTS) {
      const row = await q1<{ id: number }>(
        "INSERT INTO threads (user_id, counterpart_name, counterpart_role) VALUES ($1,$2,$3) RETURNING id",
        [user.id, name, role]
      );
      const opener = DEMO_OPENERS[name];
      if (opener) {
        const daysAgo = Math.floor(Math.random() * 5) + 1;
        await run(
          "INSERT INTO messages (thread_id, sender_id, body, created_at) VALUES ($1,0,$2,$3)",
          [Number(row!.id), opener, new Date(Date.now() - daysAgo * 86400000).toISOString()]
        );
      }
    }
  }

  const threads = await q(
    `SELECT t.*,
      (SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_body,
      (SELECT created_at FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_at,
      (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id) AS message_count
     FROM threads t WHERE t.user_id = $1 ORDER BY last_at DESC NULLS LAST, t.id ASC`,
    [user.id]
  );
  return NextResponse.json({ threads });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json();
  const name = String(b.counterpartName ?? "Consultant");
  const found = await q1<{ id: number }>(
    "SELECT id FROM threads WHERE user_id = $1 AND counterpart_name = $2", [user.id, name]
  );
  if (found) return NextResponse.json({ ok: true, id: Number(found.id) });
  const row = await q1<{ id: number }>(
    "INSERT INTO threads (user_id, counterpart_name, counterpart_role) VALUES ($1,$2,$3) RETURNING id",
    [user.id, name, b.role ?? "consultant"]
  );
  return NextResponse.json({ ok: true, id: Number(row!.id) });
}
