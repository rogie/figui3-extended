/*
PolyForm Shield License 1.0.0
https://polyformproject.org/licenses/shield/1.0.0
Required Notice: Copyright (c) 2026 Rogie King
Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)
*/
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = Math.max(1, Math.min(500, Number(limitArg?.split("=")[1]) || 100));
const apiKey = process.env.GOOGLE_FONTS_API_KEY?.trim();
const allowPublicMetadata = args.has("--public-metadata");

const AXIS_DEFAULTS = {
  ital: 0,
  opsz: 14,
  slnt: 0,
  wdth: 100,
  wght: 400,
};

function httpsUrl(value) {
  return String(value || "").replace(/^http:/, "https:");
}

function normalizeCategory(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function variantFace(variant, url) {
  const italic = String(variant).endsWith("italic") || String(variant).endsWith("i");
  const weight = Number.parseInt(String(variant), 10);
  return {
    id: `${variant}`,
    style: italic ? "Italic" : "Regular",
    weight: Number.isFinite(weight) ? weight : 400,
    ...(url ? { src: httpsUrl(url) } : {}),
  };
}

function familyQuery(font, face, variable = true) {
  const family = font.family.trim();
  const italic = String(face?.style || "").toLowerCase().includes("italic");
  const rangedAxes =
    variable && Array.isArray(font.axes)
      ? font.axes
          .filter((axis) => axis.tag !== "ital")
          .map((axis) => ({
            tag: axis.tag,
            value: `${axis.min}..${axis.max}`,
          }))
      : [];
  const axes = [
    ...(italic ? [{ tag: "ital", value: "1" }] : []),
    ...rangedAxes,
  ].sort((left, right) => left.tag.localeCompare(right.tag));
  if (axes.length) {
    return `${family}:${axes.map((axis) => axis.tag).join(",")}@${axes
      .map((axis) => axis.value)
      .join(",")}`;
  }
  const weight = Number(face?.weight) || 400;
  if (italic) return `${family}:ital,wght@1,${weight}`;
  if (weight !== 400) return `${family}:wght@${weight}`;
  return family;
}

function fontUrlFromCss(css, face) {
  const blocks = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/gi)];
  const italic = String(face?.style || "").toLowerCase().includes("italic");
  const matchingStyle = blocks.filter((match) => {
    const style =
      match[1].match(/font-style\s*:\s*([^;]+)/i)?.[1]?.trim().toLowerCase() ||
      "normal";
    return italic ? style.includes("italic") : !style.includes("italic");
  });
  const candidates = matchingStyle.length ? matchingStyle : blocks;
  const selected =
    candidates.find((match) =>
      /unicode-range\s*:[^;]*(?:U\+0000-00FF|U\+0000-024F)/i.test(match[1]),
    ) ||
    candidates.at(-1) ||
    blocks[0];
  const source = selected?.[1]?.match(
    /src\s*:[^;]*url\(\s*(?:(["'])(.*?)\1|([^)]*))\s*\)/i,
  );
  return httpsUrl((source?.[2] || source?.[3] || "").trim());
}

async function resolveCssFont(font, face, { text, variable = true } = {}) {
  const url = new URL("https://fonts.googleapis.com/css2");
  url.searchParams.set("family", familyQuery(font, face, variable));
  url.searchParams.set("display", "swap");
  if (text) url.searchParams.set("text", text);
  const response = await fetch(url, {
    headers: {
      accept: "text/css",
      "user-agent":
        "Mozilla/5.0 AppleWebKit/537.36 Chrome/140 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`Google Fonts CSS resolution failed (${response.status})`);
  }
  const fontUrl = fontUrlFromCss(await response.text(), face);
  if (!fontUrl) throw new Error(`No font URL resolved for ${font.family}`);
  return fontUrl;
}

async function hydratePublicFontUrls(catalog) {
  let nextIndex = 0;
  const hydrate = async () => {
    while (nextIndex < catalog.length) {
      const font = catalog[nextIndex++];
      const regular =
        font.faces.find(
          (face) =>
            face.weight === 400 &&
            !face.style.toLowerCase().includes("italic"),
        ) || font.faces[0];
      try {
        font.previewUrl = await resolveCssFont(font, regular, {
          text: font.family,
          variable: false,
        });
      } catch {}
      for (const face of font.faces) {
        try {
          face.src = await resolveCssFont(font, face, {
            variable: Boolean(font.axes?.length),
          });
        } catch {
          try {
            face.src = await resolveCssFont(font, face, { variable: false });
          } catch {}
        }
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, hydrate));
  return catalog;
}

function normalizeOfficial(items) {
  return items.slice(0, limit).map((font, index) => {
    const axes = (font.axes || []).map((axis) => {
      const min = Number(axis.start);
      const max = Number(axis.end);
      const fallback = AXIS_DEFAULTS[axis.tag] ?? min;
      return {
        tag: axis.tag,
        name: axis.tag,
        min,
        default: Math.max(min, Math.min(max, fallback)),
        max,
      };
    });
    return {
      family: font.family,
      category: normalizeCategory(font.category),
      popularity: index + 1,
      subsets: font.subsets || [],
      tags: (font.tags || []).map((tag) => tag.name || tag.tag).filter(Boolean),
      previewUrl: httpsUrl(font.menu),
      axes,
      faces: (font.variants || ["regular"]).map((variant) =>
        variantFace(variant, font.files?.[variant]),
      ),
    };
  });
}

function normalizePublic(metadata) {
  const axisNames = new Map(
    (metadata.axisRegistry || []).map((axis) => [
      axis.tag,
      {
        name: axis.displayName || axis.tag,
        default: Number(axis.defaultValue),
      },
    ]),
  );
  return [...(metadata.familyMetadataList || [])]
    .filter((font) => font.isOpenSource !== false && Number.isFinite(font.popularity))
    .sort((left, right) => left.popularity - right.popularity)
    .slice(0, limit)
    .map((font) => {
      const axes = (font.axes || []).map((axis) => ({
        tag: axis.tag,
        name: axisNames.get(axis.tag)?.name || axis.tag,
        min: Number(axis.min),
        default: Number.isFinite(Number(axis.defaultValue))
          ? Number(axis.defaultValue)
          : axisNames.get(axis.tag)?.default ??
            AXIS_DEFAULTS[axis.tag] ??
            Number(axis.min),
        max: Number(axis.max),
      }));
      return {
        family: font.family,
        category: normalizeCategory(font.category),
        popularity: Number(font.popularity),
        subsets: font.subsets || [],
        tags: font.classifications || [],
        axes,
        faces: Object.keys(font.fonts || { 400: {} }).map((variant) =>
          variantFace(variant),
        ),
      };
    });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Google Fonts metadata request failed (${response.status})`);
  }
  return response.json();
}

let catalog;
let source;
if (apiKey) {
  const url = new URL("https://www.googleapis.com/webfonts/v1/webfonts");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("sort", "popularity");
  url.searchParams.append("capability", "VF");
  url.searchParams.append("capability", "FAMILY_TAGS");
  catalog = normalizeOfficial((await fetchJson(url)).items || []);
  source = "google-webfonts-developer-api";
} else if (allowPublicMetadata) {
  catalog = await hydratePublicFontUrls(
    normalizePublic(await fetchJson("https://fonts.google.com/metadata/fonts")),
  );
  source = "google-fonts-public-metadata";
} else {
  throw new Error(
    "Set GOOGLE_FONTS_API_KEY, or pass --public-metadata to bootstrap without API file URLs.",
  );
}

const output = `/**
 * Generated Google Fonts catalog. Do not edit by hand.
 * Source: ${source}
 */

export const GOOGLE_FONTS_CATALOG_SOURCE = ${JSON.stringify(source)};
export const GOOGLE_FONTS_CATALOG = Object.freeze(${JSON.stringify(catalog, null, 2)});
`;
const outputPath = resolve("src/editor/data/google-fonts-catalog.js");
await mkdir(resolve("src/editor/data"), { recursive: true });
await writeFile(outputPath, output);
console.log(`Wrote ${catalog.length} Google Font families to ${outputPath}`);
