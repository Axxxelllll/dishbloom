import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  const db = env.DB;
  const { results: recipes } = await db.prepare("SELECT slug FROM recipes ORDER BY id DESC").all();
  const categories = ["vegan","keto","high-protein","5-ingredient","15-min","one-pot","meal-prep","comfort","budget","date-night","midnight","hangover","brain-food","post-workout","solo","kids","diabetic","gluten-free","no-cook","quick","dessert"];
  
  const now = new Date().toISOString().split("T")[0];
  
  let urls = `  <url><loc>https://thedishbloom.com</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${now}</lastmod></url>
  <url><loc>https://thedishbloom.com/search</loc><priority>0.6</priority></url>
  <url><loc>https://thedishbloom.com/community</loc><changefreq>daily</changefreq><priority>0.7</priority></url>
  <url><loc>https://thedishbloom.com/drinks</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>https://thedishbloom.com/about</loc><priority>0.4</priority></url>
  <url><loc>https://thedishbloom.com/privacy</loc><priority>0.3</priority></url>
  <url><loc>https://thedishbloom.com/terms</loc><priority>0.3</priority></url>\n`;

  for (const cat of categories) {
    urls += `  <url><loc>https://thedishbloom.com/category/${cat}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }

  for (const r of recipes) {
    urls += `  <url><loc>https://thedishbloom.com/recipe/${r.slug}</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>\n`;
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
