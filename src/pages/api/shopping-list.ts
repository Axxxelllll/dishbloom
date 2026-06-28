import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = env.DB;
  const token = cookies.get("db_token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Login required" }), { status: 401 });

  let user;
  try {
    user = JSON.parse(atob(token));
    if (user.exp < Date.now()) throw new Error("expired");
  } catch { return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 }); }

  const { recipe_id, servings } = await request.json();
  const recipe = await db.prepare("SELECT ingredients, servings FROM recipes WHERE id = ?").bind(recipe_id).first();
  if (!recipe) return new Response(JSON.stringify({ error: "Recipe not found" }), { status: 404 });

  const ingredients = JSON.parse(recipe.ingredients || "[]");
  const scale = (servings || recipe.servings || 4) / (recipe.servings || 4);

  const categories: Record<string, string[]> = {
    "Produce": [], "Meat & Seafood": [], "Dairy": [], "Pantry": [], "Spices": [], "Other": []
  };

  const produceWords = ["onion","garlic","tomato","potato","carrot","celery","pepper","lettuce","spinach","kale","broccoli","mushroom","avocado","lemon","lime","ginger","basil","cilantro","parsley","rosemary","thyme","mint","jalape","cucumber","zucchini","corn","pea","bean","apple","banana","berry","peach","mango","watermelon","scallion","shallot","chive","asparagus","cabbage","squash","pumpkin","beet","radish","fennel","leek","arugula","dill","sage","oregano"];
  const meatWords = ["chicken","beef","pork","steak","lamb","turkey","bacon","sausage","shrimp","salmon","fish","crab","lobster","tuna","cod","scallop","ground","ribeye","tenderloin","brisket","chorizo"];
  const dairyWords = ["milk","cream","cheese","butter","yogurt","egg","sour cream","mozzarella","parmesan","cheddar","ricotta","gruyere","provolone","cream cheese","whipping","condensed"];
  const spiceWords = ["salt","pepper","cumin","paprika","cinnamon","nutmeg","cayenne","chili powder","turmeric","oregano","thyme","bay leaf","clove","coriander","curry","mustard powder","garlic powder","onion powder","red pepper flakes","old bay","allspice","cardamom"];

  ingredients.forEach((ing: any) => {
    const item = (ing.item || "").toLowerCase();
    const amount = Math.round((ing.amount || 0) * scale * 10) / 10;
    const line = amount + " " + (ing.unit || "") + " " + ing.item;

    if (spiceWords.some(w => item.includes(w))) categories["Spices"].push(line);
    else if (produceWords.some(w => item.includes(w))) categories["Produce"].push(line);
    else if (meatWords.some(w => item.includes(w))) categories["Meat & Seafood"].push(line);
    else if (dairyWords.some(w => item.includes(w))) categories["Dairy"].push(line);
    else categories["Pantry"].push(line);
  });

  return new Response(JSON.stringify({ categories }));
};
