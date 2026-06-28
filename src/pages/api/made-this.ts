import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = env.DB;
  const recipeId = url.searchParams.get("recipe_id") || "0";
  const { results } = await db.prepare(
    "SELECT m.*, u.display_name, u.username FROM made_this m LEFT JOIN users u ON m.user_id = u.id WHERE m.recipe_id = ? ORDER BY m.id DESC LIMIT 10"
  ).bind(parseInt(recipeId)).all();
  return new Response(JSON.stringify({ entries: results }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = env.DB;
  const token = cookies.get("db_token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Login required" }), { status: 401 });

  let user;
  try {
    user = JSON.parse(atob(token));
    if (user.exp < Date.now()) throw new Error("expired");
  } catch { return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 }); }

  const { recipe_id, note } = await request.json();
  await db.prepare(
    "INSERT INTO made_this (recipe_id, user_id, note) VALUES (?, ?, ?)"
  ).bind(recipe_id, user.id, note || "I made this!").run();

  return new Response(JSON.stringify({ ok: true }));
};
