const fs = require("fs");
const p = "dist/server/wrangler.json";
if (!fs.existsSync(p)) process.exit(0);
const j = JSON.parse(fs.readFileSync(p, "utf8"));

// ONLY keep what Pages actually supports — nothing else
fs.writeFileSync(p, JSON.stringify({
  name: j.name || "dishbloom",
  compatibility_date: j.compatibility_date || "2024-12-01",
  d1_databases: j.d1_databases || [],
  r2_buckets: j.r2_buckets || [],
}));
console.log("Cleaned wrangler.json — absolute minimum");
