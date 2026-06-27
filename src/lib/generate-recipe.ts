
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

export interface Recipe {
  title: string;
  slug: string;
  description: string;
  quick_summary: string;
  cuisine: string;
  difficulty: string;
  prep_time: number;
  cook_time: number;
  total_time: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: { amount: number; unit: string; item: string; group: string }[];
  steps: { title: string; text: string; timer: number }[];
  substitutions: { original: string; swap: string }[];
  common_mistakes: string[];
  tags: string[];
  dietary: string[];
  category: string;
}

export async function generateRecipe(prompt: string): Promise<Recipe> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
      system: `You are a professional recipe writer for DishBloom, a visual food discovery platform. Generate a single recipe as valid JSON only — no markdown, no backticks, no explanation. Return ONLY the JSON object with these exact fields:
{
  "title": "Recipe Title",
  "slug": "recipe-title-lowercase-dashed",
  "description": "2-3 sentence appetizing description",
  "quick_summary": "30 second summary of the entire recipe in 1-2 sentences",
  "cuisine": "Italian/Indian/Mexican/etc",
  "difficulty": "Easy/Medium/Hard",
  "prep_time": 10,
  "cook_time": 15,
  "total_time": 25,
  "servings": 4,
  "calories": 420,
  "protein": 38,
  "carbs": 12,
  "fat": 26,
  "fiber": 3,
  "ingredients": [{"amount": 2, "unit": "tbsp", "item": "olive oil", "group": "Sauce"}],
  "steps": [{"title": "Step name", "text": "Detailed instruction", "timer": 300}],
  "substitutions": [{"original": "Heavy cream", "swap": "Coconut cream for dairy-free"}],
  "common_mistakes": ["Mistake 1", "Mistake 2"],
  "tags": ["chicken", "quick", "italian"],
  "dietary": ["high-protein", "gluten-free"],
  "category": "quick"
}
Timer is in seconds (0 if no timer needed). Be creative, specific, and appetizing. Include 5-7 steps, 8-15 ingredients grouped logically, 3-4 substitutions, and 3-4 common mistakes.`
    }),
  });

  const data = await res.json() as any;
  const text = data.content[0].text.replace(/\`\`\`json|\n\`\`\`/g, "").trim();
  return JSON.parse(text);
}

export async function generateFoodImage(dishTitle: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENAI_KEY,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: `Professional food photography of ${dishTitle}. Top-down or 45-degree angle, natural daylight, white marble or wooden surface, shallow depth of field, garnished beautifully, restaurant quality plating. No text, no watermarks.`,
      n: 1,
      size: "1024x1024",
      quality: "high",
    }),
  });

  const data = await res.json() as any;
  return data.data[0].b64_json || data.data[0].url;
}
