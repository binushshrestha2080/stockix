const fs   = require("fs");
const path = require("path");

const filePath = path.join("src", "app", "dashboard", "alerts", "page.tsx");
let content = fs.readFileSync(filePath, "utf8");

// Fix: API already includes /api, so remove the /api prefix from all fetch calls
content = content.replace(
  'API + "/api/alerts"',
  'API + "/alerts"'
);
content = content.replace(
  'API + "/api/alerts", {',
  'API + "/alerts", {'
);
content = content.replace(
  'API + "/api/alerts/" + id, { method: "DELETE"',
  'API + "/alerts/" + id, { method: "DELETE"'
);
content = content.replace(
  'API + "/api/alerts/" + id + "/deactivate"',
  'API + "/alerts/" + id + "/deactivate"'
);

// Fix all at once with global replace
content = content.split('API + "/api/alerts"').join('API + "/alerts"');
content = content.split('API + "/api/alerts/').join('API + "/alerts/');

fs.writeFileSync(filePath, content);
console.log("Fixed: removed double /api from all fetch calls");
console.log("Done! Refresh http://localhost:3000/dashboard/alerts");
