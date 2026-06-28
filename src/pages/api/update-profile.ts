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
  } catch {
    return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
  }

  const { name, bio } = await request.json();
  await db.prepare("UPDATE users SET display_name = ?, bio = ? WHERE id = ?").bind(name || "", bio || "", user.id).run();

  return new Response(JSON.stringify({ ok: true }));
};
