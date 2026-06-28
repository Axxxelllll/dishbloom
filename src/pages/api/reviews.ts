import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = env.DB;
  const recipeId = url.searchParams.get("recipe_id") || "0";
  const { results } = await db.prepare(
    "SELECT r.*, u.display_name, u.username FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.recipe_id = ? ORDER BY r.id DESC LIMIT 20"
  ).bind(parseInt(recipeId)).all();
  return new Response(JSON.stringify({ reviews: results }), {
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

  const { recipe_id, rating, comment } = await request.json();
  if (!recipe_id || !rating) return new Response(JSON.stringify({ error: "Rating required" }), { status: 400 });

  await db.prepare(
    "INSERT INTO reviews (recipe_id, user_id, rating, comment) VALUES (?, ?, ?, ?)"
  ).bind(recipe_id, user.id, rating, comment || "").run();

  const avg = await db.prepare(
    "SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE recipe_id = ?"
  ).bind(recipe_id).first();

  await db.prepare(
    "UPDATE recipes SET avg_rating = ?, review_count = ? WHERE id = ?"
  ).bind(Math.round((avg?.avg_rating || 0) * 10) / 10, avg?.count || 0, recipe_id).run();

  return new Response(JSON.stringify({ ok: true, avg_rating: avg?.avg_rating, count: avg?.count }));
};
