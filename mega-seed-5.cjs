const fs = require("fs");
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const RECIPES = [
  "Mac and Cheese Waffles, Cereal Milk French Toast, Everything Bagel Avocado Toast",
  "Croissant Breakfast Boats, Birria Eggs Benedict, Hot Honey Chicken Biscuit Sliders",
  "Pancake Tacos, Churro Waffles, Red Velvet Chicken and Waffles",
  "Bourbon Bacon Cinnamon Rolls, Cookie Butter Crepes, Biscuits and Gravy Pot Pie",
  "Birria Grilled Cheese, Mac and Cheese Stuffed Burgers, Nashville Hot Chicken Lasagna",
  "Smashed Burger Tacos, Doritos Chicken Tenders, Buffalo Chicken Pull Apart Bread",
  "Ramen Crusted Corn Dogs, Pulled Pork Mac and Cheese, Flamin Hot Cheetos Mac and Cheese",
  "BBQ Brisket Bao Buns, Lobster Roll Sliders, Glazed Donut Cheeseburger",
  "Cajun Seafood Boil Pasta, Chicken Parmesan Garlic Bread, Sloppy Joe Sliders with Queso",
  "Pastrami Crunchwrap, Deep Fried Lasagna Bites, General Tso Chicken Pizza",
  "Accordion Potatoes, Elote Corn Ribs, Fried Pickle Dippers",
  "Bacon Wrapped Onion Rings, Bloomin Onion Bread, Sweet Potato Fries Marshmallow Dip",
  "Mac and Cheese Egg Rolls, Hasselback Potatoes with Queso, Cornbread Waffles",
  "Philly Cheesesteak Fries, Jalapeno Popper Wontons, Garlic Knot Monkey Bread",
  "Street Corn Nachos, Pizza Fries, Soft Pretzels Beer Cheese Fondue",
  "Crookie Croissant Cookie, Deep Fried Oreos, Banana Pudding Taco",
  "Cookie Dough Egg Rolls, Apple Pie Egg Rolls, Cheesecake Stuffed Strawberries",
  "Brownie Brittle Nachos, Churro Ice Cream Bowls, Peanut Butter Cup Lava Cake",
  "Salted Caramel Pretzel Brownies, Cookie Butter Cheesecake Bars, Red Velvet Churros",
  "Apple Cider Donut Bread Pudding, Mississippi Mud Icebox Cake, Campfire Smores Bark",
  "Classic Oklahoma Fried Onion Burger, NYC Chopped Cheese, Juicy Lucy Burger",
  "Patty Melt, Green Chile Cheeseburger, Pimento Cheese Burger",
  "San Diego Fish Tacos, Birria Tacos with Consome, Mission Style Burrito",
  "Carne Asada Fries, Walking Tacos, Street Corn Quesadilla",
  "Crunchwrap Supreme Copycat, Carnitas Tacos, Chimichanga",
  "Nashville Hot Chicken Sandwich, Classic Buffalo Wings, Popcorn Chicken Bites",
  "Garlic Parmesan Wings, Honey BBQ Chicken Tenders, Lemon Pepper Wings",
  "Korean Soy Garlic Wings, General Tso Chicken Bites, Bourbon Chicken",
  "Disco Fries, Fried Dill Pickles, Hushpuppies",
  "Classic Funnel Cake, Beignets, Churro Ice Cream Sandwiches",
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
  fs.writeFileSync("db/mega-seed-5.sql", all.map(toSQL).join("\n"));
  console.log("Saved to db/mega-seed-5.sql");
  console.log("Run: node _insert-mega.cjs");
}
main();
