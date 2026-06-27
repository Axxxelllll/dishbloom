const { execSync } = require("child_process");
const fs = require("fs");

const out = execSync('npx wrangler d1 execute dishbloom-db --remote --command="SELECT id, slug FROM recipes WHERE hero_image IS NULL OR hero_image = \'\'" --json', { encoding: "utf8" });
const slugs = JSON.parse(out)[0].results;
console.log(slugs.length + " recipes need images\n");

let ok = 0, fail = 0;
for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i].slug;
  const id = slugs[i].id;
  const tmp = "tmp_" + slug + ".png";
  console.log((i+1) + "/" + slugs.length + " " + slug);
  try {
    // Download from local R2
    execSync("npx wrangler r2 object get dishbloom-images/" + slug + ".png --file " + tmp, { stdio: "pipe" });
    // Upload to remote R2
    execSync("npx wrangler r2 object put dishbloom-images/" + slug + ".png --file " + tmp + " --content-type image/png --remote", { stdio: "pipe" });
    // Update DB
    const url = "https://pub-f1539c7a692446819b7edb1d05b5bd58.r2.dev/" + slug + ".png";
    execSync('npx wrangler d1 execute dishbloom-db --remote --command="UPDATE recipes SET hero_image = \'' + url + '\' WHERE id = ' + id + ';"', { stdio: "pipe" });
    fs.unlinkSync(tmp);
    console.log("  OK");
    ok++;
  } catch(e) {
    try { fs.unlinkSync(tmp); } catch(e2) {}
    console.log("  SKIP");
    fail++;
  }
}
console.log("\nDone: " + ok + " uploaded, " + fail + " skipped");
