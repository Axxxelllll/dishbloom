import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = env.DB;
  const recipeId = url.searchParams.get("id") || "0";
  const category = url.searchParams.get("category") || "comfort";
  const cuisine = url.searchParams.get("cuisine") || "";

  const { results } = await db.prepare(
    "SELECT id, title, slug, hero_image, total_time, calories, avg_rating FROM recipes WHERE id != ? AND (category = ? OR cuisine = ?) AND hero_image IS NOT NULL AND hero_image != '' ORDER BY RANDOM() LIMIT 6"
  ).bind(parseInt(recipeId), category, cuisine).all();

  return new Response(JSON.stringify({ recipes: results }), {
    headers: { "Content-Type": "application/json" },
  });
};
