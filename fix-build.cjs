const fs = require("fs");
const p = "dist/server/wrangler.json";
if (!fs.existsSync(p)) process.exit(0);
const j = JSON.parse(fs.readFileSync(p, "utf8"));

fs.writeFileSync(p, JSON.stringify({
  name: "dishbloom",
  pages_build_output_dir: "./dist",
  compatibility_date: j.compatibility_date || "2024-12-01",
  compatibility_flags: j.compatibility_flags || [],
  d1_databases: j.d1_databases || [],
  r2_buckets: j.r2_buckets || [],
  vars: {},
  no_bundle: true,
}));

// Also fix the deploy config to use wrangler.toml instead
const dc = ".wrangler/deploy/config.json";
if (fs.existsSync(dc)) fs.unlinkSync(dc);

console.log("Fixed — Pages mode with pages_build_output_dir");
