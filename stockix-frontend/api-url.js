const fs = require("fs");
const filePath = "src/app/dashboard/alerts/page.tsx";
let content = fs.readFileSync(filePath, "utf8");

// Replace whatever is on the API line with a hardcoded URL
const lines = content.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("const API =")) {
    lines[i] = 'const API = "http://localhost:5000/api";';
    break;
  }
}
content = lines.join("\n");
fs.writeFileSync(filePath, content);
console.log("Fixed API URL");

// Verify
const check = fs.readFileSync(filePath, "utf8").split("\n").find(l => l.startsWith("const API"));
console.log("Line now reads: " + check);