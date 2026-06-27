const fs = require("fs");
const { execSync } = require("child_process");
const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function getRecipes() {
  const out = execSync('npx wrangler d1 execute dishbloom-db --remote --command="SELECT id, title, slug FROM recipes WHERE hero_image IS NULL OR hero_image = \'\'" --json', { encoding: "utf8" });
  const parsed = JSON.parse(out);
  return parsed[0].results;
}

async function generateImage(title) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + OPENAI_KEY,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: "Hyper-colorful, vibrant, unrealistic food photography of " + title + ". Extremely saturated colors, dreamy pastel background, glowing neon food highlights, studio lighting, top-down angle, clean white plate, magical food art style. No text, no watermarks.",
      n: 1,
      size: "1024x1024",
      quality: "medium",
    }),
  });
  const data = await res.json();
  if (data.error) { console.log("  IMG ERROR: " + data.error.message); return null; }
  return data.data[0].b64_json;
}

async function uploadToR2(slug, base64) {
  const buf = Buffer.from(base64, "base64");
  const tmpFile = "tmp_img_" + slug + ".png";
  fs.writeFileSync(tmpFile, buf);
  try {
    execSync("npx wrangler r2 object put dishbloom-images/ --remote " + slug + ".png --file=" + tmpFile + " --content-type=image/png", { stdio: "pipe" });
  } catch(e) {
    console.log("  R2 upload failed");
    return false;
  }
  fs.unlinkSync(tmpFile);
  return true;
}

async function updateDB(id, slug) {
  const url = "https://pub-f1539c7a692446819b7edb1d05b5bd58.r2.dev/" + slug + ".png";
  const cmd = 'npx wrangler d1 execute dishbloom-db --remote --command="UPDATE recipes SET hero_image = \'' + url + '\' WHERE id = ' + id + ';"';
  execSync(cmd, { stdio: "pipe" });
}

async function main() {
  console.log("Fetching recipes without images...\n");
  const recipes = await getRecipes();
  console.log(recipes.length + " recipes need images\n");

  let ok = 0, fail = 0;
  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    console.log((i+1) + "/" + recipes.length + " " + r.title);
    
    const b64 = await generateImage(r.title);
    if (!b64) { fail++; continue; }
    
    const uploaded = await uploadToR2(r.slug, b64);
    if (!uploaded) { fail++; continue; }
    
    await updateDB(r.id, r.slug);
    console.log("  Done!");
    ok++;
    
    // Small delay
    if (i < recipes.length - 1) await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log("\nFinished: " + ok + " images generated, " + fail + " failed");
}

main();
