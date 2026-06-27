const fs = require("fs");
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const RECIPES = [
  "banana bread, meatloaf, chili con carne, classic pancakes, chocolate chip cookies",
  "french toast, lasagna, alfredo pasta, brownies, mac and cheese",
  "sourdough bread, chicken tikka masala, pad thai, butter chicken, beef tacos",
  "fried rice, caesar salad, guacamole, hummus, chicken noodle soup",
  "overnight oats, smoothie bowl, avocado toast, egg fried rice, ramen from scratch",
  "fish tacos, pulled pork, beef stew, chicken alfredo, greek yogurt parfait",
  "vegan buddha bowl, vegan mac and cheese, vegan tacos, vegan curry, vegan chocolate cake",
  "vegan stir fry, vegan burger, vegan soup, vegan pasta, vegan pancakes",
  "keto pizza, keto bread, keto brownies, keto chicken thighs, keto salmon",
  "keto cauliflower mash, keto egg muffins, keto avocado boats, keto steak bites, keto fat bombs",
  "protein pancakes, chicken breast meal prep, turkey meatballs, shrimp stir fry, egg white omelette",
  "greek chicken bowl, tuna poke bowl, cottage cheese bowl, protein overnight oats, protein smoothie",
  "lentil soup, rice and beans, egg fried rice budget, pasta aglio olio, potato soup",
  "bean burritos, oatmeal variations, chickpea curry, tuna pasta, ramen upgrade",
  "chicken pot pie, grilled cheese and tomato soup, shepherd pie, mashed potatoes, fried chicken",
  "biscuits and gravy, cheeseburger, loaded baked potato, chicken and dumplings, pot roast",
  "tiramisu, cheesecake, lemon curd tart, creme brulee, chocolate mousse",
  "panna cotta, apple pie, cinnamon rolls, banana pudding, carrot cake",
  "marry me chicken, million dollar chicken casserole, dirty spaghetti, big mac smash tacos, cottage cheese flatbread",
  "quesabirria tacos, hot honey chicken bowl, cabbage boil, wisconsin booyah, magic lemon pie",
];

async function gen(names) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      messages: [{ role: "user", content: "Generate exactly 5 recipes: " + names }],
      system: `Return ONLY a JSON array of 5 recipe objects. No markdown fences, no backticks, no text before or after. Just [ {...}, {...}, {...}, {...}, {...} ]. Fields: title(string), slug(string), description(string,2 sentences), quick_summary(string,1 sentence), cuisine(string), difficulty(Easy/Medium/Hard), prep_time(int), cook_time(int), total_time(int), servings(int), calories(int), protein(int), carbs(int), fat(int), fiber(int), ingredients(array of {amount:number,unit:string,item:string,group:string}), steps(array of {title:string,text:string,timer:int seconds}), substitutions(array of {original:string,swap:string}), common_mistakes(array of strings), tags(array), dietary(array), category(string). RULES: No apostrophes anywhere. Write "do not" not "don't". Times are integers. 8-10 ingredients, 5 steps, 3 substitutions, 3 mistakes per recipe. Keep descriptions SHORT.`,
    }),
  });
  const data = await res.json();
  if (data.error) { console.log("  ERR: " + data.error.message); return []; }
  let t = data.content[0].text;
  const s = t.indexOf("[");
  const e = t.lastIndexOf("]");
  if (s === -1 || e === -1) { console.log("  No array found"); return []; }
  t = t.substring(s, e + 1);
  try { return JSON.parse(t); }
  catch(err) { console.log("  Parse fail: " + err.message.substring(0, 60)); return []; }
}

function toSQL(r) {
  const e = (s) => String(s||"").replace(/'/g, "''");
  return `INSERT INTO recipes (title,slug,description,quick_summary,cuisine,difficulty,prep_time,cook_time,total_time,servings,calories,protein,carbs,fat,fiber,ingredients,steps,substitutions,common_mistakes,tags,dietary,category,source) VALUES ('${e(r.title)}','${e(r.slug)}','${e(r.description)}','${e(r.quick_summary)}','${e(r.cuisine)}','${e(r.difficulty)}',${r.prep_time||0},${r.cook_time||0},${r.total_time||0},${r.servings||4},${r.calories||0},${r.protein||0},${r.carbs||0},${r.fat||0},${r.fiber||0},'${e(JSON.stringify(r.ingredients))}','${e(JSON.stringify(r.steps))}','${e(JSON.stringify(r.substitutions))}','${e(JSON.stringify(r.common_mistakes))}','${e(JSON.stringify(r.tags))}','${e(JSON.stringify(r.dietary))}','${e(r.category)}','ai');`;
}

async function main() {
  console.log("MEGA SEED: 20 batches x 5 = 100 recipes\n");
  let all = [];
  for (let i = 0; i < RECIPES.length; i++) {
    console.log((i+1) + "/" + RECIPES.length + " — " + RECIPES[i].substring(0, 50) + "...");
    const r = await gen(RECIPES[i]);
    console.log("  Got " + r.length);
    all = all.concat(r);
    if (i < RECIPES.length - 1) await new Promise(r => setTimeout(r, 2000));
  }
  console.log("\nTotal: " + all.length);
  fs.writeFileSync("db/mega-seed.sql", all.map(toSQL).join("\n"));
  console.log("Saved to db/mega-seed.sql");
  console.log("Run: node _insert-mega.cjs");
}
main();
