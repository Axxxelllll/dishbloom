const { execSync } = require("child_process");
const fs = require("fs");
const sql = fs.readFileSync("db/mega-seed-4.sql", "utf8");
const stmts = sql.split(/;\n/).filter(s => s.trim().startsWith("INSERT"));
console.log("Inserting " + stmts.length + " recipes...\n");
let ok = 0, fail = 0;
for (let i = 0; i < stmts.length; i++) {
  let s = stmts[i].trim();
  if (!s.endsWith(";")) s += ";";
  fs.writeFileSync("db/_tmp.sql", s);
  try {
    execSync("npx wrangler d1 execute dishbloom-db --remote --file=db/_tmp.sql", { stdio: "pipe", timeout: 30000 });
    const t = s.match(/VALUES \('([^']*?)'/);
    console.log((i+1) + ". OK  " + (t ? t[1] : ""));
    ok++;
  } catch(e) {
    const t = s.match(/VALUES \('([^']*?)'/);
    console.log((i+1) + ". FAIL " + (t ? t[1] : ""));
    fail++;
  }
}
try { fs.unlinkSync("db/_tmp.sql"); } catch(e) {}
console.log("\nDone: " + ok + " inserted, " + fail + " failed");
