import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = env.DB;
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const cat = url.searchParams.get("category") || "";

  let query = "SELECT id, title, slug, hero_image, total_time, calories, avg_rating, dietary, category FROM recipes";
  let where = " WHERE hero_image IS NOT NULL AND hero_image != ''";
  
  if (cat) where += " AND (category = '" + cat.replace(/'/g, "") + "' OR dietary LIKE '%" + cat.replace(/'/g, "") + "%')";
  
  query += where + " ORDER BY RANDOM() LIMIT " + limit + " OFFSET " + offset;
  const { results } = await db.prepare(query).all();
  
  return new Response(JSON.stringify({ recipes: results, hasMore: results.length === limit }), {
    headers: { "Content-Type": "application/json" },
  });
};
