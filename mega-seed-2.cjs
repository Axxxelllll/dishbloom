const fs = require("fs");
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const RECIPES = [
  "Million Dollar Chicken Casserole, Marry Me Chicken, Dirty Spaghetti",
  "Big Mac Smash Tacos, Cottage Cheese Flatbread, Quesabirria Tacos",
  "Hot Honey Chicken Bowl, Cabbage Boil, Wisconsin Booyah",
  "Magic Lemon Pie, Harissa Orange Chicken, Garlic Butter Steak Bites",
  "Creamy Cajun Pasta Skillet, French Onion Chicken, Skillet Lasagna Roll-Ups",
  "Honey Garlic Chicken Thighs, Mexican Street Corn Chicken, Cheesy Taco Pasta",
  "Lemon Garlic Salmon Asparagus, Crispy Gnocchi Pesto, Greek Lemon Chicken Soup",
  "Italian Pastina Soup, Million Dollar Soup, Lasagna Soup",
  "French Onion Soup, Tuscan White Bean Kale Soup, Slow Cooker Texas Chili",
  "Chicken Tortilla Soup, Stuffed Pepper Soup, Creamy Potato Soup",
  "Famous Indian Butter Chicken, Korean Gochujang Fried Chicken, Pastel de Nata",
  "Italian Carbonara, Jamaican Jerk Chicken Wings, Japanese Souffle Pancakes",
  "Spanish Seafood Paella, Thai Pad See Ew, Southern Fried Chicken",
  "Chicken Marsala, Air Fryer Chicken Tenders, Creamy Mushroom Chicken Thighs",
  "Beef Stroganoff, Swedish Meatballs with Gravy, Smash Burgers",
  "Cast Iron Ribeye Steak, Mongolian Beef, Philly Cheesesteak Sandwiches",
  "Honey Garlic Glazed Salmon, Shrimp Scampi, Air Fryer Coconut Shrimp",
  "Maryland Crab Cakes, Cajun Shrimp and Grits, Lobster Rolls",
  "New York Cheesecake, Lemon Curd Tart, Creme Brulee",
  "Cinnamon Rolls, Banana Bread Chocolate Chips, Carrot Cake",
];
async function gen(names) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 4096,
      messages: [{ role: "user", content: "Generate exactly 3 recipes: " + names }],
      system: "Return ONLY a JSON array of 3 recipe objects. No markdown, no backticks. Just [ {...}, {...}, {...} ]. Fields: title, slug, description(2 sentences), quick_summary(1 sentence), cuisine, difficulty(Easy/Medium/Hard), prep_time(int), cook_time(int), total_time(int), servings(int), calories(int), protein(int), carbs(int), fat(int), fiber(int), ingredients([{amount:number,unit:string,item:string,group:string}]), steps([{title:string,text:string,timer:int seconds}]), substitutions([{original:string,swap:string}]), common_mistakes([strings]), tags([strings]), dietary([strings]), category(string). NEVER use apostrophes in text. Write do not instead of dont. 8 ingredients, 5 steps, 3 substitutions, 3 mistakes.",
    }),
  });
  const data = await res.json();
  if (data.error) { console.log("  ERR: " + data.error.message); return []; }
  let t = data.content[0].text;
  const s = t.indexOf("["); const e = t.lastIndexOf("]");
  if (s === -1 || e === -1) { console.log("  No array"); return []; }
  t = t.substring(s, e + 1);
  try { return JSON.parse(t); } catch(err) {
    t = t.replace(/[\u2018\u2019']/g, ""); t = t.replace(/[\u201C\u201D]/g, '"');
    try { return JSON.parse(t); } catch(e2) { console.log("  Parse fail"); return []; }
  }
}
function toSQL(r) {
  const e = (s) => String(s||"").replace(/'/g, "''");
  return "INSERT INTO recipes (title,slug,description,quick_summary,cuisine,difficulty,prep_time,cook_time,total_time,servings,calories,protein,carbs,fat,fiber,ingredients,steps,substitutions,common_mistakes,tags,dietary,category,source) VALUES ('" + e(r.title) + "','" + e(r.slug) + "','" + e(r.description) + "','" + e(r.quick_summary) + "','" + e(r.cuisine) + "','" + e(r.difficulty) + "'," + (r.prep_time||0) + "," + (r.cook_time||0) + "," + (r.total_time||0) + "," + (r.servings||4) + "," + (r.calories||0) + "," + (r.protein||0) + "," + (r.carbs||0) + "," + (r.fat||0) + "," + (r.fiber||0) + ",'" + e(JSON.stringify(r.ingredients)) + "','" + e(JSON.stringify(r.steps)) + "','" + e(JSON.stringify(r.substitutions)) + "','" + e(JSON.stringify(r.common_mistakes)) + "','" + e(JSON.stringify(r.tags)) + "','" + e(JSON.stringify(r.dietary)) + "','" + e(r.category) + "','ai');";
}
async function main() {
  console.log("WAVE 2: " + RECIPES.length + " batches x 3 = " + (RECIPES.length*3) + " recipes");
  let all = [];
  for (let i = 0; i < RECIPES.length; i++) {
    console.log((i+1) + "/" + RECIPES.length + " " + RECIPES[i].substring(0,50) + "...");
    const r = await gen(RECIPES[i]);
    console.log("  Got " + r.length);
    all = all.concat(r);
    if (i < RECIPES.length - 1) await new Promise(r => setTimeout(r, 2000));
  }
  console.log("Total: " + all.length);
  fs.writeFileSync("db/mega-seed-2.sql", all.map(toSQL).join("\n"));
  console.log("Saved to db/mega-seed-2.sql");
  console.log("Run: node _insert-mega-2.cjs");
}
main();