
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const RECIPE_PROMPTS = [
  "Create a quick 15-minute garlic butter shrimp pasta recipe. Category: quick. Dietary: high-protein.",
  "Create a vegan Buddha bowl with tahini dressing recipe. Category: meal-prep. Dietary: vegan, high-protein.",
  "Create a classic chicken tikka masala recipe. Category: comfort. Dietary: high-protein, gluten-free.",
  "Create a 3-ingredient banana pancakes recipe for broke college students. Category: budget. Dietary: vegetarian.",
  "Create a keto-friendly cauliflower mac and cheese recipe. Category: keto. Dietary: keto, gluten-free.",
  "Create a spicy ramen with soft-boiled egg recipe, perfect for midnight cravings. Category: midnight. Dietary: none.",
  "Create a Mediterranean Greek salad bowl recipe. Category: no-cook. Dietary: vegetarian, gluten-free.",
  "Create a one-pot creamy tomato basil soup recipe. Category: one-pot. Dietary: vegetarian.",
  "Create a high-protein post-workout chicken and quinoa bowl. Category: post-workout. Dietary: high-protein, gluten-free.",
  "Create an impressive beef Wellington for date night. Category: date-night. Dietary: none.",
  "Create a 5-ingredient chocolate lava cake recipe. Category: 5-ingredient. Dietary: vegetarian.",
  "Create a diabetic-friendly grilled salmon with roasted vegetables. Category: diabetic. Dietary: diabetic, high-protein, gluten-free.",
  "Create a kid-friendly hidden veggie pasta sauce that sneaks in spinach and carrots. Category: kids. Dietary: vegetarian.",
  "Create a hangover cure loaded breakfast burrito recipe. Category: hangover. Dietary: high-protein.",
  "Create an anti-inflammatory turmeric golden milk latte recipe. Category: anti-inflammatory. Dietary: vegan, dairy-free.",
  "Create a meal prep Sunday honey garlic chicken with rice and broccoli. Category: meal-prep. Dietary: high-protein.",
  "Create a PCOS-friendly low-glycemic berry smoothie bowl. Category: pcos. Dietary: pcos-friendly, gluten-free.",
  "Create a pregnancy-safe iron-rich spinach and lentil dal. Category: pregnancy. Dietary: pregnancy-safe, vegan.",
  "Create a heart-healthy baked cod with lemon herb crust. Category: heart-healthy. Dietary: heart-healthy, high-protein.",
  "Create an exam week brain food: salmon avocado poke bowl. Category: brain-food. Dietary: high-protein, gluten-free.",
];

async function generateOne(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
      system: "You are a professional recipe writer for DishBloom. Generate a single recipe as valid JSON only — no markdown, no backticks, no explanation. Return ONLY the JSON object with these fields: title, slug, description, quick_summary, cuisine, difficulty (Easy/Medium/Hard), prep_time, cook_time, total_time, servings, calories, protein, carbs, fat, fiber, ingredients (array of {amount, unit, item, group}), steps (array of {title, text, timer} where timer is seconds), substitutions (array of {original, swap}), common_mistakes (array of strings), tags (array), dietary (array), category (string). Be creative and appetizing.",
    }),
  });
  const data = await res.json();
  const text = data.content[0].text.replace(/\`\`\`json|\`\`\`/g, "").trim();
  return JSON.parse(text);
}

async function main() {
  console.log("Generating " + RECIPE_PROMPTS.length + " recipes with Claude...\n");
  const recipes = [];
  
  for (let i = 0; i < RECIPE_PROMPTS.length; i++) {
    try {
      console.log((i + 1) + "/" + RECIPE_PROMPTS.length + " — generating...");
      const recipe = await generateOne(RECIPE_PROMPTS[i]);
      recipes.push(recipe);
      console.log("   ✓ " + recipe.title);
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.log("   ✗ Failed: " + e.message);
    }
  }

  // Write SQL insert file
  let sql = "";
  for (const r of recipes) {
    const esc = (s) => (s || "").replace(/'/g, "''");
    sql += "INSERT INTO recipes (title, slug, description, quick_summary, cuisine, difficulty, prep_time, cook_time, total_time, servings, calories, protein, carbs, fat, fiber, ingredients, steps, substitutions, common_mistakes, tags, dietary, category, source) VALUES ("
      + "'" + esc(r.title) + "', "
      + "'" + esc(r.slug) + "', "
      + "'" + esc(r.description) + "', "
      + "'" + esc(r.quick_summary) + "', "
      + "'" + esc(r.cuisine) + "', "
      + "'" + esc(r.difficulty) + "', "
      + r.prep_time + ", "
      + r.cook_time + ", "
      + r.total_time + ", "
      + r.servings + ", "
      + (r.calories || 0) + ", "
      + (r.protein || 0) + ", "
      + (r.carbs || 0) + ", "
      + (r.fat || 0) + ", "
      + (r.fiber || 0) + ", "
      + "'" + esc(JSON.stringify(r.ingredients)) + "', "
      + "'" + esc(JSON.stringify(r.steps)) + "', "
      + "'" + esc(JSON.stringify(r.substitutions)) + "', "
      + "'" + esc(JSON.stringify(r.common_mistakes)) + "', "
      + "'" + esc(JSON.stringify(r.tags)) + "', "
      + "'" + esc(JSON.stringify(r.dietary)) + "', "
      + "'" + esc(r.category) + "', "
      + "'ai'"
      + ");\n";
  }

  require("fs").writeFileSync("db/seed.sql", sql);
  console.log("\nDone! " + recipes.length + " recipes saved to db/seed.sql");
  console.log("Run: npx wrangler d1 execute dishbloom-db --remote --file=db/seed.sql");
}

main();
