import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password + "dishbloom-salt-2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const user = await db.prepare("SELECT id, email, username, display_name FROM users WHERE email = ? AND password_hash = ?").bind(email, hash).first();

  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid email or password" }), { status: 401 });
  }

  const token = btoa(JSON.stringify({ id: user.id, email: user.email, name: user.display_name, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

  return new Response(JSON.stringify({ user, token }), {
    status: 200,
    headers: {
      "Set-Cookie": "db_token=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800",
      "Content-Type": "application/json",
    },
  });
};
