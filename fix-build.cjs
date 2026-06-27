const fs = require("fs");
const path = require("path");

// Cloudflare Pages looks for _worker.js in the output directory
// Move client files to dist root, create _worker.js entry

// 1. Copy client files to dist root
const clientDir = "dist/client";
if (fs.existsSync(clientDir)) {
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(src)) {
      const s = path.join(src, f);
      const d = path.join(dest, f);
      if (fs.statSync(s).isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  };
  copyDir(clientDir, "dist");
}

// 2. Create _worker.js that re-exports the server entry
fs.writeFileSync("dist/_worker.js",
  'import worker from "./server/entry.mjs";\nexport default worker;\n'
);

// 3. Delete the problematic wrangler.json and deploy config
const wj = "dist/server/wrangler.json";
if (fs.existsSync(wj)) fs.unlinkSync(wj);
const dc = path.join(".wrangler", "deploy", "config.json");
if (fs.existsSync(dc)) fs.unlinkSync(dc);

console.log("Created _worker.js + moved client assets to dist root");
