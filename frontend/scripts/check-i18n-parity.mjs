import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const dir = dirname(fileURLToPath(import.meta.url));
const pat = /"([^"]+)":/g;
function keys(file) {
  const text = readFileSync(join(dir, "..", "src", "i18n", "locales", file), "utf8");
  return new Set([...text.matchAll(pat)].map((m) => m[1]));
}
const en = keys("en.js");
const tr = keys("tr.js");
const missingTr = [...en].filter((k) => !tr.has(k)).sort();
const missingEn = [...tr].filter((k) => !en.has(k)).sort();
console.log("missing in tr:", missingTr.length, missingTr.join(", ") || "(none)");
console.log("missing in en:", missingEn.length, missingEn.join(", ") || "(none)");
