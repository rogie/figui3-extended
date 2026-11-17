/*
PolyForm Shield License 1.0.0
https://polyformproject.org/licenses/shield/1.0.0
Required Notice: Copyright (c) 2026 Rogie King
Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)
*/
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { GOOGLE_FONTS_CATALOG } from "../src/editor/data/google-fonts-catalog.js";

const TAGS_URL =
  "https://raw.githubusercontent.com/google/fonts/main/tags/all/families.csv";

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }
  fields.push(field);
  return fields;
}

const response = await fetch(TAGS_URL);
if (!response.ok) {
  throw new Error(`Google Family Tags request failed (${response.status})`);
}

const catalogFamilies = new Set(GOOGLE_FONTS_CATALOG.map(({ family }) => family));
const byFamily = new Map();
for (const line of (await response.text()).split(/\r?\n/)) {
  const [family, axes, tag, scoreText] = parseCsvLine(line);
  if (
    !catalogFamilies.has(family) ||
    axes ||
    !/^\/(?:Purpose|Display)\//.test(tag)
  ) {
    continue;
  }
  const score = Number(scoreText);
  if (!Number.isFinite(score) || score < 50) continue;
  const tags = byFamily.get(family) || [];
  if (!tags.includes(tag)) tags.push(tag);
  byFamily.set(family, tags);
}

const snapshot = Object.fromEntries(
  [...byFamily]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([family, tags]) => [family, tags.sort()]),
);
const output = `/**
 * Generated Google Family Tags snapshot. Do not edit by hand.
 * Source: ${TAGS_URL}
 */

export const GOOGLE_FONT_FAMILY_TAGS = Object.freeze(${JSON.stringify(snapshot, null, 2)});
`;
const outputPath = resolve("src/editor/data/google-font-family-tags.js");
await writeFile(outputPath, output);
console.log(`Wrote tags for ${byFamily.size} Google Font families to ${outputPath}`);
