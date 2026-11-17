import { existsSync, readFileSync, readdirSync } from "node:fs";
import { outputs } from "./artifacts.mjs";

const manifest = JSON.parse(readFileSync("package.json", "utf8"));
const expected = [...outputs].sort();
const actual = readdirSync("dist")
  .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
  .sort();

if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(
    `Artifact inventory differs\nexpected ${expected.join(", ")}\nactual ${actual.join(", ")}`,
  );
}

const targets = Object.values(manifest.exports).flatMap((value) =>
  typeof value === "string" ? [value] : Object.values(value),
);
for (const target of targets) {
  const normalizedTarget = target.replace(/^\.\//, "");
  const pathToCheck = normalizedTarget.includes("*")
    ? normalizedTarget.slice(0, normalizedTarget.indexOf("*"))
    : normalizedTarget;
  if (!existsSync(pathToCheck)) {
    throw new Error(`Missing package target ${target}`);
  }
}

for (const file of expected.filter((entry) => entry.endsWith(".js"))) {
  const source = readFileSync(`dist/${file}`, "utf8");
  if (!source.includes("@rogieking/figui3/")) {
    throw new Error(`${file} does not retain an external FigUI3 dependency`);
  }
}

console.log(`Artifact inventory verified: ${expected.length} dist files.`);
