const fs = require("fs");

// Read the raw SQL and see what's wrong
const sql = fs.readFileSync("db/seed.sql", "utf8");

// Show the problematic area
console.log("Around offset 891:");
console.log(sql.substring(850, 950));
console.log("\n---\nFirst INSERT statement:");
console.log(sql.substring(0, sql.indexOf(";") + 1));
