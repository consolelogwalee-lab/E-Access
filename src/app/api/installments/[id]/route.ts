import { NextResponse } from "next/server";
import { q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const plan = await q1<{ id: number; user_id: number; total_amount: number | string; amount_paid: number | string; listing_id: number }>(
    "SELECT * FROM installments WHERE id = $1 AND user_id = $2", [Number(id), user.id]
  );
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  const b = await req.json();
  const amount = Number(b.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "A payment amount is required." }, { status: 400 });
  const remaining = Number(plan.total_amount) - Number(plan.amount_paid);
  if (amount > remaining)
    return NextResponse.json({ error: "That payment is more than the remaining balance." }, { status: 400 });
  await run("INSERT INTO installment_payments (installment_id, amount, note) VALUES ($1,$2,$3)",
    [plan.id, amount, b.note ? String(b.note).slice(0, 200) : null]);
  await run("UPDATE installments SET amount_paid = amount_paid + $1, next_due_date = $2 WHERE id = $3",
    [amount, b.nextDueDate || null, plan.id]);
  const newPaid = Number(plan.amount_paid) + amount;
  if (newPaid >= Number(plan.total_amount)) {
    await notify(user.id, "success", "Payment plan completed",
      "You have fully paid for this property. Congratulations on your new asset.", "/dashboard/payments");
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  await run("DELETE FROM installment_payments WHERE installment_id IN (SELECT id FROM installments WHERE id = $1 AND user_id = $2)", [Number(id), user.id]);
  await run("DELETE FROM installments WHERE id = $1 AND user_id = $2", [Number(id), user.id]);
  return NextResponse.json({ ok: true });
}
