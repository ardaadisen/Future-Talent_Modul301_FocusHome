import fs from "fs";
import path from "path";

const CLOUD_FRONT = String.raw`c:\Users\ardaa\OneDrive\Desktop\TumDersler\2026\CS436\Projects\FocusHome Cloud AI-Powered Focus Planning and Gamified Productivity Platform\focushome-cloud\frontend\src`;
const CLOUD_SHARED = String.raw`c:\Users\ardaa\OneDrive\Desktop\TumDersler\2026\CS436\Projects\FocusHome Cloud AI-Powered Focus Planning and Gamified Productivity Platform\focushome-cloud\shared\src`;
const TARGET = path.resolve("src");

const SKIP_FRONT = new Set([
  "App.tsx",
  "main.tsx",
  "index.css",
  "navigation.ts",
  path.join("api", "client.ts"),
  path.join("api", "focusHomeApi.ts"),
  path.join("hooks", "useAppData.ts"),
  path.join("types", "index.ts"),
]);

function stripTypeScript(source) {
  let s = source;

  s = s.replace(/^import\s+type\s+[^'"]*['"][^'"]+['"]\s*;?\s*$/gm, "");
  s = s.replace(/^import\s+type\s+{[^}]+}\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm, "");
  s = s.replace(/import\s*{\s*([^}]+)\s*}\s*from/g, (_, inner) => {
    const cleaned = inner
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith("type "))
      .join(", ");
    return cleaned ? `import { ${cleaned} } from` : "import {} from";
  });
  s = s.replace(/^import\s*{\s*}\s*from\s+['"][^'"]+['"]\s*;?\s*$/gm, "");

  s = s.replace(/^export\s+type\s+[^;]+;?\s*$/gm, "");
  s = s.replace(/^export\s+type\s+{[\s\S]*?};?\s*$/gm, "");
  s = s.replace(/^export\s+interface\s+[\s\S]*?^};?\s*$/gm, "");
  s = s.replace(/^interface\s+[\s\S]*?^}\s*$/gm, "");
  s = s.replace(/^type\s+\w+[\s\S]*?;\s*$/gm, "");

  s = s.replace(/\bReact\.(FormEvent|MouseEvent|ChangeEvent|KeyboardEvent|SyntheticEvent)(<[^>]+>)?/g, "Event");
  s = s.replace(/:\s*PropsWithChildren(?:<[^>]+>)?/g, "");
  s = s.replace(/<[A-Za-z_$][\w$.,\s|&<>\[\]"'?:]*>(?=\s*\()/g, "");
  s = s.replace(/useState<[^>]+>/g, "useState");
  s = s.replace(/useMemo<[^>]+>/g, "useMemo");
  s = s.replace(/useCallback<[^>]+>/g, "useCallback");
  s = s.replace(/useRef<[^>]+>/g, "useRef");
  s = s.replace(/Promise<[^>]+>/g, "Promise");
  s = s.replace(/Record<[^>]+>/g, "Object");
  s = s.replace(/\s+as\s+const\b/g, "");
  s = s.replace(/\s+as\s+[A-Za-z_$][\w$.|&<>\[\]"'?:]*/g, "");
  s = s.replace(/:\s*CSSProperties\b/g, "");
  s = s.replace(/\):\s*[A-Za-z_$][\w$.|&<>\[\]"'?:\s]*\s*=>/g, ") =>");
  s = s.replace(/:\s*["'][A-Z_]+["']\s*\|\s*["'][A-Z_]+["'](?:\s*\|\s*["'][A-Z_]+["'])*/g, "");
  s = s.replace(/:\s*(?:string|number|boolean|null|void|unknown|any)(?:\s*\|\s*(?:string|number|boolean|null))*\b/g, "");
  s = s.replace(/:\s*[A-Za-z_$][\w$.|&<>\[\]"'?:]*\s*(?=[,)=])/g, "");

  return s;
}

function toJsExt(filePath) {
  if (filePath.endsWith(".tsx")) return filePath.replace(/\.tsx$/, ".jsx");
  if (filePath.endsWith(".ts")) return filePath.replace(/\.ts$/, ".js");
  return filePath;
}

function fixImports(content, fromDir, isShared = false) {
  let s = content;

  s = s.replace(/from\s+["']@focushome\/shared["']/g, () => {
    const rel = path.relative(fromDir, path.join(TARGET, "shared")).split(path.sep).join("/");
    const prefix = rel.startsWith(".") ? rel : `./${rel}`;
    return `from "${prefix}/index.js"`;
  });

  s = s.replace(/from\s+["']\.\/tierThemes["']/g, 'from "./tierThemes.js"');
  s = s.replace(/from\s+["']\.\.\/types["']/g, "");
  s = s.replace(/from\s+["']\.\.\/types\/index["']/g, "");
  s = s.replace(/from\s+["']\.\.\/hooks\/useAppData["']/g, 'from "../hooks/useAppData.js"');
  s = s.replace(/from\s+["']\.\.\/navigation["']/g, 'from "../navigation.js"');

  const importRe = /from\s+["'](\.[^"']+)["']/g;
  s = s.replace(importRe, (match, relImport) => {
    if (!relImport.startsWith(".")) return match;
    if (relImport.endsWith(".js") || relImport.endsWith(".jsx")) return match;
    const abs = path.resolve(fromDir, relImport);
    const candidates = [`${abs}.js`, `${abs}.jsx`, path.join(abs, "index.js")];
    if (fs.existsSync(`${abs}.jsx`) || relImport.includes("/components/") || relImport.includes("/pages/")) {
      return `from "${relImport}.jsx"`;
    }
    return `from "${relImport}.js"`;
  });

  if (isShared) {
    s = s.replace(/import\s+type\s+[^;]+;?\s*/g, "");
    s = s.replace(/:\s*import\([^)]+\)\.[\w.]+/g, "");
    s = s.replace(/:\s*DecorationPlacement\[\]/g, "");
    s = s.replace(/value is DecorationSlotKey/g, "value");
    s = s.replace(/:\s*value is \w+/g, "");
  }

  return s;
}

function writeConverted(srcPath, destRel, isShared = false) {
  const destPath = path.join(TARGET, destRel);
  const destDir = path.dirname(destPath);
  fs.mkdirSync(destDir, { recursive: true });

  let content = fs.readFileSync(srcPath, "utf8");
  content = stripTypeScript(content);
  content = fixImports(content, destDir, isShared);

  if (destRel === "utils/tierThemes.js") {
    content = content.replace(
      /export\s*{\s*SLOT_ZONE_HINTS\s+as\s+SLOT_SCENE_HINTS\s*}\s*from\s+["'][^"']+["'];?/,
      'export { SLOT_ZONE_HINTS as SLOT_SCENE_HINTS } from "../shared/decorationZones.js";',
    );
  }

  if (destRel === "utils/cozyRoom.js") {
    content = `export {
  ROOM_THEME,
  SLOT_SCENE_HINTS,
  getTierTheme,
  getTierThemeStyles,
  TIER_THEMES
} from "./tierThemes.js";
`;
  }

  if (destRel === "utils/homeTiers.js") {
    content = content.replace(
      /export\s*{\s*getTierTheme,\s*TIER_THEMES,\s*getTierThemeStyles\s*}\s*from\s+["'][^"']+["'];?/,
      'export { getTierTheme, TIER_THEMES, getTierThemeStyles } from "./tierThemes.js";',
    );
    content = content.replace(/export type \{[^}]+\};?\s*/g, "");
  }

  fs.writeFileSync(destPath, content, "utf8");
  return destPath;
}

function walkAndPort(srcRoot, destSubdir, isShared = false) {
  const written = [];
  function walk(dir, rel = "") {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, relPath);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (!isShared && SKIP_FRONT.has(relPath.replace(/\\/g, "/"))) continue;

      const destRel = toJsExt(path.join(destSubdir, relPath).replace(/\\/g, "/"));
      writeConverted(full, destRel, isShared);
      written.push(destRel);
    }
  }
  walk(srcRoot);
  return written;
}

const sharedWritten = walkAndPort(CLOUD_SHARED, "shared", true);
const frontWritten = walkAndPort(CLOUD_FRONT, ".", false);

console.log("Shared:", sharedWritten.length);
console.log("Frontend:", frontWritten.length);
console.log(sharedWritten.join("\n"));
console.log("---");
console.log(frontWritten.join("\n"));
