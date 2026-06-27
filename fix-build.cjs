const fs = require("fs");
const p = "dist/server/wrangler.json";
if (!fs.existsSync(p)) process.exit(0);
const j = JSON.parse(fs.readFileSync(p, "utf8"));

// For Workers-style Pages (SSR), we need main + assets
// but must NOT have pages_build_output_dir alongside main
const clean = {
  name: j.name || "dishbloom",
  main: j.main || "entry.mjs",
  compatibility_date: j.compatibility_date || "2024-12-01",
  compatibility_flags: j.compatibility_flags || [],
  assets: { directory: j.assets?.directory || "../client" },
  d1_databases: j.d1_databases || [],
  r2_buckets: j.r2_buckets || [],
  no_bundle: true,
};

fs.writeFileSync(p, JSON.stringify(clean));
console.log("Fixed wrangler.json — Workers-style Pages with SSR");
