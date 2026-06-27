const fs = require("fs");

// Delete the problematic generated wrangler.json entirely
const p = "dist/server/wrangler.json";
if (fs.existsSync(p)) fs.unlinkSync(p);

// Delete the deploy config that redirects to it
const d = ".wrangler/deploy/config.json";
if (fs.existsSync(d)) fs.unlinkSync(d);

console.log("Removed generated wrangler.json — using root wrangler.toml only");
