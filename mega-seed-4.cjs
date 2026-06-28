const fs = require("fs");
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const RECIPES = [
  "Million Dollar Chicken Casserole, Neiman Marcus Chicken, Cowboy Butter Spaghetti",
  "Stick of Butter Chicken and Rice, Swamp Potatoes and Sausage, Turkish Pasta",
  "Sheet Pan Gnocchi with Sausage, Lemon Butter Shrimp Skillet, Beef and Broccoli Stir Fry",
  "One Pot Creamy Sun Dried Tomato Pasta, Cast Iron Pizza Pie, Greek Chicken Rice Skillet",
  "White Chicken Chili Enchilada Casserole, Easy Creamy Potato Soup, Cheddar Cauliflower Chowder",
  "Chicken Dumpling Soup, Smoked Sausage Lentil Stew, Creamy Tomato Basil Bisque",
  "Grated Parmesan Crusted Potatoes, Upside Down Puff Pastry Tarts, Feta Crusted Fried Eggs",
  "Crispy Smashed Potato Salad, Chopped Italian Sandwich Bowls, Cottage Cheese Cookie Dough",
  "Million Dollar Cucumber Salad, Marinated Carrot Salad Chili Crisp, Green Goddess Salad Dip",
  "Frozen Dumpling Bake Casserole, Viral Cabbage Boil, Cottage Cheese Egg Scramble",
  "Pan Fried Potstickers Guotie, Lebanese Garlic Sauce Toum, Street Style Elote Corn Cups",
  "Vietnamese Pork Banh Mi, Greek Pork Souvlaki Pita, Brazilian Fraldinha Steak",
  "Classic Cuban Picadillo, Bolognese Stuffed Peppers, Slow Cooker Shepherds Pie",
  "Vintage Porcupine Meatballs, Homemade Sloppy Joes, Bacon Wrapped Meatloaf",
  "Smoky BBQ Pork Ribs, Savory Lamb Stew, Garlic Herb Pork Tenderloin",
  "Spicy Peanut Noodles with Shrimp, Cedar Plank Salmon, Classic Salmon Patties",
  "Blackened Fish Tacos, Lemon Herb Baked Cod, Miso Glazed Sea Bass",
  "Creamy Vodka Sauce Pasta, Baked Ziti Ricotta, Penne alla Vodka",
  "Fettuccine Alfredo, Cacio e Pepe, Homemade Potato Gnocchi",
  "Green Bean Casserole, Creamy Garlic Mashed Potatoes, Honey Roasted Butternut Squash",
  "Air Fryer Brussels Sprouts Balsamic, Roasted Broccoli Parmesan, Creamed Spinach Bake",
  "Classic Fudgy Brownies, Strawberry Rhubarb Pie, Tunnel of Fudge Cake",
  "Swedish Cardamom Buns, Matcha Tiramisu, Lemon Chiffon Cake",
  "No Bake Lemon Bars, Cinnamon Roll Butter Swim Biscuits, Old Fashioned Apple Crisp",
  "Crispy Rice Spicy Tuna Bites, Air Fryer Pasta Chips, Spicy Salmon Rice Bowls",
  "Zuppa Toscana, Broccoli Cheddar Soup, Chicken Noodle Soup",
  "Pozole Rojo, Lobster Bisque, Hungarian Mushroom Soup",
  "New England Clam Chowder, Minestrone Soup, Roasted Butternut Squash Soup",
  "Korean BBQ Short Ribs, Roasted Lamb Chops Mint Pesto, Instant Pot Carnitas",
  "Orange Chicken Copycat, Air Fryer Chicken Wings, Balsamic Glazed Chicken",
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
  fs.writeFileSync("db/mega-seed-4.sql", all.map(toSQL).join("\n"));
  console.log("Saved to db/mega-seed-4.sql");
  console.log("Run: node _insert-mega.cjs");
}
main();
