import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  const db = env.DB;
  const { results: recipes } = await db.prepare(
    "SELECT title, slug, description, hero_image, cuisine, total_time, calories, created_at FROM recipes WHERE hero_image IS NOT NULL AND hero_image != '' ORDER BY id DESC LIMIT 100"
  ).all();

  const items = recipes.map((r: any) => {
    const url = "https://thedishbloom.com/recipe/" + r.slug;
    const img = r.hero_image || "";
    const date = r.created_at ? new Date(r.created_at).toUTCString() : new Date().toUTCString();
    return `    <item>
      <title><![CDATA[${r.title}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description><![CDATA[${r.description || ""}]]></description>
      <pubDate>${date}</pubDate>
      ${img ? `<enclosure url="${img}" type="image/png" />` : ""}
      <media:content url="${img}" medium="image" />
      <media:thumbnail url="${img}" />
    </item>`;
  }).join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DishBloom — Discover Beautiful Food</title>
    <link>https://thedishbloom.com</link>
    <description>Visual food discovery platform. Browse stunning recipes, save to collections, and cook with confidence.</description>
    <language>en</language>
    <atom:link href="https://thedishbloom.com/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>https://thedishbloom.com/favicon.svg</url>
      <title>DishBloom</title>
      <link>https://thedishbloom.com</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
