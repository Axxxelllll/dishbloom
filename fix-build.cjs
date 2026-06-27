const fs = require("fs");
const path = "dist/server/wrangler.json";
if (!fs.existsSync(path)) { console.log("No wrangler.json found"); process.exit(0); }
const j = JSON.parse(fs.readFileSync(path, "utf8"));

// Fix ASSETS binding
if (j.assets) j.assets.binding = "STATIC_ASSETS";

// Remove problematic fields
delete j.images;
delete j.previews;
j.kv_namespaces = [];

// Remove unsupported Pages fields
delete j.main;
delete j.rules;

fs.writeFileSync(path, JSON.stringify(j));
console.log("Fixed wrangler.json for Pages deploy");
