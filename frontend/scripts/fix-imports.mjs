import fs from "fs";
import path from "path";

const SRC = path.resolve("src");

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(js|jsx)$/.test(entry.name)) continue;

    let content = fs.readFileSync(full, "utf8");
    const updated = content.replace(
      /from (["'])(\.[^"']+)\.js\1/g,
      (match, quote, relImport) => {
        const abs = path.resolve(path.dirname(full), relImport);
        if (fs.existsSync(`${abs}.jsx`)) {
          return `from ${quote}${relImport}.jsx${quote}`;
        }
        return match;
      },
    );

    if (updated !== content) {
      fs.writeFileSync(full, updated, "utf8");
    }
  }
}

walk(SRC);
console.log("Import extensions fixed.");
