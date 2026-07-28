import { run } from "./db";

export async function notify(
  userId: number,
  kind: "inquiry" | "inspection" | "verification" | "info" | "success" | "alert",
  title: string,
  body?: string,
  href?: string
) {
  try {
    await run(
      "INSERT INTO notifications (user_id, kind, title, body, href) VALUES ($1,$2,$3,$4,$5)",
      [userId, kind, title, body ?? null, href ?? null]
    );
  } catch {
    // notifications are best-effort; never fail the main action
  }
}
