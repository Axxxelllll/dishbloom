const fs = require("fs");
const path = "dist/server/wrangler.json";
if (!fs.existsSync(path)) process.exit(0);
const j = JSON.parse(fs.readFileSync(path, "utf8"));
const clean = {
  name: j.name,
  compatibility_date: j.compatibility_date,
  compatibility_flags: j.compatibility_flags || [],
  pages_build_output_dir: j.pages_build_output_dir,
  d1_databases: j.d1_databases || [],
  r2_buckets: j.r2_buckets || [],
  vars: j.vars || {},
};
fs.writeFileSync(path, JSON.stringify(clean));
console.log("Cleaned wrangler.json");
