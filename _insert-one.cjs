const { execSync } = require("child_process");
const fs = require("fs");

const sql = fs.readFileSync("db/seed.sql", "utf8");
const statements = sql.split(/;\s*\n/).filter(s => s.trim().startsWith("INSERT"));

console.log("Inserting " + statements.length + " recipes one by one...\n");

let success = 0;
let fail = 0;

for (let i = 0; i < statements.length; i++) {
  let stmt = statements[i].trim();
  if (!stmt.endsWith(";")) stmt += ";";
  
  // Write single statement to temp file
  fs.writeFileSync("db/_tmp.sql", stmt);
  
  try {
    execSync("npx wrangler d1 execute dishbloom-db --remote --file=db/_tmp.sql", { 
      stdio: "pipe",
      timeout: 30000 
    });
    const title = stmt.match(/VALUES \('([^']*?)'/);
    console.log((i+1) + ". OK - " + (title ? title[1] : "unknown"));
    success++;
  } catch (e) {
    const title = stmt.match(/VALUES \('([^']*?)'/);
    console.log((i+1) + ". FAIL - " + (title ? title[1] : "unknown"));
    fail++;
  }
}

fs.unlinkSync("db/_tmp.sql");
console.log("\nDone: " + success + " inserted, " + fail + " failed");
