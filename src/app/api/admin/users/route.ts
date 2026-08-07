import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteUserCascade } from "@/lib/users";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const users = await q(
    `SELECT u.id, u.full_name, u.email, u.email_verified, u.avatar_color, u.role, u.created_at,
      (SELECT COUNT(*) FROM listings l WHERE l.owner_id = u.id) AS listing_count,
      (SELECT COUNT(*) FROM inquiries i WHERE i.sender_id = u.id) AS inquiry_count
     FROM users u ORDER BY u.created_at DESC, u.id DESC LIMIT 500`
  );
  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const b = await req.json();
  if (!["admin", "user"].includes(b.role))
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  if (Number(b.id) === admin.id)
    return NextResponse.json({ error: "You can't change your own role." }, { status: 400 });
  await run("UPDATE users SET role = $1 WHERE id = $2", [b.role, Number(b.id)]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  if (!id) return NextResponse.json({ error: "No user specified." }, { status: 400 });
  if (id === admin.id) return NextResponse.json({ error: "You can't delete your own account here." }, { status: 400 });
  const target = await q1<{ role: string }>("SELECT role FROM users WHERE id = $1", [id]);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role === "admin") return NextResponse.json({ error: "Remove admin rights before deleting an admin account." }, { status: 400 });
  await deleteUserCascade(id);
  return NextResponse.json({ ok: true });
}
