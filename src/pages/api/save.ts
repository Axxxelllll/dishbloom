import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = env.DB;
  const token = cookies.get("db_token")?.value;

  if (!token) {
    return new Response(JSON.stringify({ error: "Login required" }), { status: 401 });
  }

  let user;
  try {
    user = JSON.parse(atob(token));
    if (user.exp < Date.now()) throw new Error("expired");
  } catch {
    return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
  }

  const { recipe_id, action } = await request.json();

  if (action === "unsave") {
    await db.prepare("DELETE FROM collection_recipes WHERE collection_id IN (SELECT id FROM collections WHERE user_id = ? AND name = 'Saved') AND recipe_id = ?").bind(user.id, recipe_id).run();
    return new Response(JSON.stringify({ saved: false }));
  }

  let collection = await db.prepare("SELECT id FROM collections WHERE user_id = ? AND name = 'Saved'").bind(user.id).first();
  if (!collection) {
    await db.prepare("INSERT INTO collections (user_id, name, description) VALUES (?, 'Saved', 'Your saved recipes')").bind(user.id).run();
    collection = await db.prepare("SELECT id FROM collections WHERE user_id = ? AND name = 'Saved'").bind(user.id).first();
  }

  try {
    await db.prepare("INSERT INTO collection_recipes (collection_id, recipe_id) VALUES (?, ?)").bind(collection.id, recipe_id).run();
    await db.prepare("UPDATE recipes SET total_saves = total_saves + 1 WHERE id = ?").bind(recipe_id).run();
  } catch(e) {}

  return new Response(JSON.stringify({ saved: true }));
};
