import { q, run } from "@/lib/db";

/**
 * Delete a user and the data tied to them, so nothing is left dangling.
 * Their own listings (and media/documents), conversations, saved items,
 * validation requests, offers, inspections and notifications are removed.
 * There are no DB-level foreign keys, so we clean each table explicitly.
 */
export async function deleteUserCascade(userId: number): Promise<void> {
  const id = Number(userId);

  // Listings they own + attached media/documents
  const listings = await q<{ id: number }>("SELECT id FROM listings WHERE owner_id = $1", [id]);
  for (const l of listings) {
    await run("DELETE FROM listing_media WHERE listing_id = $1", [Number(l.id)]);
    await run("DELETE FROM listing_documents WHERE listing_id = $1", [Number(l.id)]);
  }
  await run("DELETE FROM listings WHERE owner_id = $1", [id]);

  // Conversations they're part of + messages/read markers
  const threads = await q<{ id: number }>("SELECT id FROM threads WHERE user_id = $1 OR peer_id = $1", [id]);
  for (const t of threads) {
    await run("DELETE FROM messages WHERE thread_id = $1", [Number(t.id)]);
    await run("DELETE FROM thread_reads WHERE thread_id = $1", [Number(t.id)]);
  }
  await run("DELETE FROM threads WHERE user_id = $1 OR peer_id = $1", [id]);
  await run("DELETE FROM thread_reads WHERE user_id = $1", [id]);

  // Validation requests + their files/events
  const vreqs = await q<{ id: number }>("SELECT id FROM validation_requests WHERE user_id = $1", [id]);
  for (const v of vreqs) {
    await run("DELETE FROM validation_files WHERE request_id = $1", [Number(v.id)]);
    await run("DELETE FROM validation_events WHERE request_id = $1", [Number(v.id)]);
  }
  await run("DELETE FROM validation_requests WHERE user_id = $1", [id]);

  // Everything else keyed to the user
  await run("DELETE FROM saved_listings WHERE user_id = $1", [id]);
  await run("DELETE FROM saved_searches WHERE user_id = $1", [id]);
  await run("DELETE FROM notifications WHERE user_id = $1", [id]);
  await run("DELETE FROM inquiries WHERE sender_id = $1", [id]);
  await run("DELETE FROM inspections WHERE requester_id = $1", [id]);
  await run("DELETE FROM offers WHERE user_id = $1", [id]);
  await run("DELETE FROM property_requests WHERE user_id = $1", [id]);
  await run("DELETE FROM reviews WHERE user_id = $1 OR developer_id = $1", [id]);
  await run("DELETE FROM agents WHERE user_id = $1", [id]);
  await run("DELETE FROM sessions WHERE user_id = $1", [id]);
  await run("DELETE FROM users WHERE id = $1", [id]);
}
