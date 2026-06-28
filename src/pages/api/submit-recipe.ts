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

  const body = await request.json();
  const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") + "-" + Math.floor(Math.random() * 9999);

  const ingredientLines = body.ingredients.split("\n").filter((l: string) => l.trim());
  const ingredients = ingredientLines.map((line: string) => {
    const match = line.match(/^([\d.]+)\s*(\w+)?\s+(.+)/);
    if (match) return { amount: parseFloat(match[1]), unit: match[2] || "", item: match[3], group: "Main" };
    return { amount: 1, unit: "", item: line.trim(), group: "Main" };
  });

  const stepLines = body.steps.split("\n").filter((l: string) => l.trim());
  const steps = stepLines.map((line: string, i: number) => ({
    title: "Step " + (i + 1),
    text: line.trim(),
    timer: 0,
  }));

  const tags = body.tags ? body.tags.split(",").map((t: string) => t.trim()) : [];

  await db.prepare(
    "INSERT INTO recipes (title, slug, description, quick_summary, cuisine, difficulty, prep_time, cook_time, total_time, servings, ingredients, steps, tags, category, source, author_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    body.title, slug, body.description || "", body.description || "",
    body.cuisine || "Other", body.difficulty || "Easy",
    body.prep_time || 0, body.cook_time || 0, (body.prep_time || 0) + (body.cook_time || 0),
    body.servings || 4,
    JSON.stringify(ingredients), JSON.stringify(steps), JSON.stringify(tags),
    "comfort", "user", user.id
  ).run();

  return new Response(JSON.stringify({ slug }), { status: 200 });
};
