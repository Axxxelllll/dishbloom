import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const { email, password, name } = await request.json();

  if (!email || !password || !name) {
    return new Response(JSON.stringify({ error: "All fields required" }), { status: 400 });
  }

  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return new Response(JSON.stringify({ error: "Email already registered" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password + "dishbloom-salt-2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const username = name.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 999);

  await db.prepare(
    "INSERT INTO users (email, password_hash, username, display_name) VALUES (?, ?, ?, ?)"
  ).bind(email, hash, username, name).run();

  const user = await db.prepare("SELECT id, email, username, display_name FROM users WHERE email = ?").bind(email).first();

  const token = btoa(JSON.stringify({ id: user.id, email: user.email, name: user.display_name, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

  return new Response(JSON.stringify({ user, token }), {
    status: 200,
    headers: {
      "Set-Cookie": "db_token=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800",
      "Content-Type": "application/json",
    },
  });
};
