import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = env.DB;
  const token = cookies.get("db_token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Login required" }), { status: 401 });

  let user;
  try {
    user = JSON.parse(atob(token));
    if (user.exp < Date.now()) throw new Error("expired");
  } catch { return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 }); }

  const { poll_id, option } = await request.json();

  const existing = await db.prepare(
    "SELECT id FROM poll_votes WHERE poll_id = ? AND user_id = ?"
  ).bind(poll_id, user.id).first();

  if (existing) return new Response(JSON.stringify({ error: "Already voted" }), { status: 400 });

  await db.prepare(
    "INSERT INTO poll_votes (poll_id, user_id, option_selected) VALUES (?, ?, ?)"
  ).bind(poll_id, user.id, option).run();

  const { results: votes } = await db.prepare(
    "SELECT option_selected, COUNT(*) as count FROM poll_votes WHERE poll_id = ? GROUP BY option_selected"
  ).bind(poll_id).all();

  return new Response(JSON.stringify({ ok: true, votes }));
};
