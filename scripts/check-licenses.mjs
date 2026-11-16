import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { NOTICE } from "./artifacts.mjs";

function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? files(child) : [child];
  });
}

const paths = [
  "fig-editor.js",
  "fig-editor.css",
  "fig-lab.js",
  "fig-lab.css",
  ...files("src").filter((file) => /\.(?:js|css)$/.test(file)),
  ...files(".cursor/skills"),
  ...files("skills"),
  ...files("dist"),
];

for (const path of paths) {
  const contents = readFileSync(path, "utf8");
  for (const token of NOTICE) {
    if (!contents.includes(token)) {
      throw new Error(`${path} is missing ${JSON.stringify(token)}`);
    }
  }
}

const license = readFileSync("LICENSE", "utf8");
for (const token of NOTICE) {
  if (!license.includes(token)) throw new Error(`LICENSE is missing ${token}`);
}

console.log(`License notices verified for ${paths.length} files.`);
