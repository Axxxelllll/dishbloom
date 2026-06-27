const fs = require("fs");
const p = "dist/server/wrangler.json";
if (!fs.existsSync(p)) process.exit(0);
const j = JSON.parse(fs.readFileSync(p, "utf8"));

// Remove only the problematic fields, keep everything else
delete j.images;
delete j.previews;
delete j.main;
delete j.rules;

// Fix assets — remove reserved binding name but keep directory
if (j.assets) {
  j.assets = { directory: j.assets.directory || "../client" };
}

// Fix KV — remove session binding (no ID)
j.kv_namespaces = [];

fs.writeFileSync(p, JSON.stringify(j));
console.log("Fixed wrangler.json");
