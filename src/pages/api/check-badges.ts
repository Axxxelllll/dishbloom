import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  const db = env.DB;
  const token = cookies.get("db_token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Login required" }), { status: 401 });

  let user;
  try {
    user = JSON.parse(atob(token));
    if (user.exp < Date.now()) throw new Error("expired");
  } catch { return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 }); }

  const userId = user.id;
  const newBadges: string[] = [];

  // Count recipes
  const recipeCount = await db.prepare("SELECT COUNT(*) as c FROM recipes WHERE author_id = ?").bind(userId).first();
  const rc = recipeCount?.c || 0;
  if (rc >= 1) newBadges.push("first-recipe");
  if (rc >= 5) newBadges.push("five-recipes");
  if (rc >= 10) newBadges.push("ten-recipes");
  if (rc >= 25) newBadges.push("twenty-five-recipes");
  if (rc >= 50) newBadges.push("fifty-recipes");
  if (rc >= 100) newBadges.push("hundred-recipes");

  // Count reviews
  const reviewCount = await db.prepare("SELECT COUNT(*) as c FROM reviews WHERE user_id = ?").bind(userId).first();
  const rvc = reviewCount?.c || 0;
  if (rvc >= 1) newBadges.push("first-review");
  if (rvc >= 10) newBadges.push("ten-reviews");

  // Count saves
  const saveCount = await db.prepare("SELECT COUNT(*) as c FROM collection_recipes cr JOIN collections col ON cr.collection_id = col.id WHERE col.user_id = ?").bind(userId).first();
  const sc = saveCount?.c || 0;
  if (sc >= 1) newBadges.push("first-save");
  if (sc >= 50) newBadges.push("fifty-saves");

  // Count made this
  const madeCount = await db.prepare("SELECT COUNT(*) as c FROM made_this WHERE user_id = ?").bind(userId).first();
  const mc = madeCount?.c || 0;
  if (mc >= 5) newBadges.push("made-five");
  if (mc >= 20) newBadges.push("made-twenty");

  // Early adopter (first 100 users)
  if (userId <= 100) newBadges.push("early-adopter");

  // Save badges to user
  await db.prepare("UPDATE users SET badges = ? WHERE id = ?")
    .bind(JSON.stringify(newBadges), userId).run();

  return new Response(JSON.stringify({ badges: newBadges }));
};
