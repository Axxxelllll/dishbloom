const fs = require("fs");
const p = "dist/server/wrangler.json";
if (!fs.existsSync(p)) process.exit(0);
const j = JSON.parse(fs.readFileSync(p, "utf8"));

// Pages ONLY supports these top-level fields
const allowed = new Set([
  "name", "compatibility_date", "compatibility_flags",
  "pages_build_output_dir", "d1_databases", "r2_buckets",
  "kv_namespaces", "vars", "durable_objects", "queues",
  "services", "analytics_engine_datasets", "ai",
  "vectorize", "hyperdrive", "send_email",
  "mtls_certificates", "dispatch_namespaces",
  "logfwdr", "placement", "no_bundle"
]);

const clean = {};
for (const key of Object.keys(j)) {
  if (allowed.has(key)) clean[key] = j[key];
}

// KV needs id field — remove any without it
if (clean.kv_namespaces) {
  clean.kv_namespaces = clean.kv_namespaces.filter(k => k.id);
}

fs.writeFileSync(p, JSON.stringify(clean));
console.log("Cleaned: kept " + Object.keys(clean).join(", "));
