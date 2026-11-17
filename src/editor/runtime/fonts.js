/*
PolyForm Shield License 1.0.0
https://polyformproject.org/licenses/shield/1.0.0
Required Notice: Copyright (c) 2026 Rogie King
Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)
*/
/**
 * Font-picker normalization, CSS serialization, and minimal OpenType parsing.
 */

const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
]);

const MAX_FONT_BYTES = 32 * 1024 * 1024;
const FONT_ROLES = new Set(["body", "headline", "display", "code"]);
const REGISTERED_AXES = new Set(["wght", "wdth", "ital", "slnt", "opsz"]);

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeWeight(value) {
  const text = cleanText(value);
  if (!text || text === "normal") return 400;
  if (text === "bold") return 700;
  const rangeStart = Number(text.split(/\s+/)[0]);
  return Number.isFinite(rangeStart) ? Math.max(1, Math.min(1000, rangeStart)) : 400;
}

function normalizeStretch(value) {
  const text = cleanText(value);
  const number = Number.parseFloat(text);
  return Number.isFinite(number) ? number : undefined;
}

export function normalizeFontAxis(axis) {
  if (!axis || typeof axis !== "object") return null;
  const tag = cleanText(axis.tag).slice(0, 4);
  if (tag.length !== 4) return null;
  const min = finiteNumber(axis.min, 0);
  const max = finiteNumber(axis.max, min);
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const defaultValue = Math.max(
    low,
    Math.min(high, finiteNumber(axis.default, finiteNumber(axis.value, low))),
  );
  return {
    tag,
    name: cleanText(axis.name) || tag,
    min: low,
    default: defaultValue,
    max: high,
  };
}

export function normalizeFontAxesValue(value, definitions = []) {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(
    definitions
      .map(normalizeFontAxis)
      .filter(Boolean)
      .map((axis) => [
        axis.tag,
        Math.max(
          axis.min,
          Math.min(axis.max, finiteNumber(source[axis.tag], axis.default)),
        ),
      ]),
  );
}

export function normalizeFontInstance(instance, axes = [], index = 0) {
  if (!instance || typeof instance !== "object") return null;
  const name = cleanText(instance.name || instance.label);
  return {
    id: cleanText(instance.id) || name || `instance-${index + 1}`,
    name: name || `Instance ${index + 1}`,
    coordinates: normalizeFontAxesValue(
      instance.coordinates || instance.axes,
      axes,
    ),
  };
}

export function normalizeFontRoles(value) {
  const entries = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  const aliases = {
    "body & ui": "body",
    body: "body",
    text: "body",
    ui: "body",
    headline: "headline",
    heading: "headline",
    display: "display",
    "display+": "display",
    code: "code",
    mono: "code",
    monospace: "code",
  };
  return [
    ...new Set(
      entries
        .map((entry) => aliases[cleanText(entry).toLocaleLowerCase()])
        .filter((entry) => FONT_ROLES.has(entry)),
    ),
  ];
}

function tagText(tag) {
  return cleanText(typeof tag === "object" ? tag.name || tag.tag : tag);
}

export function fontRecommendationScores(family) {
  const authored = normalizeFontRoles(family?.roles);
  const scores = { body: 0, headline: 0, display: 0, code: 0 };
  for (const role of authored) scores[role] = 100;
  const tags = (family?.tags || []).map((tag) =>
    tagText(tag).toLocaleLowerCase(),
  );
  const easyReading = tags.some((tag) =>
    tag.includes("/purpose/easy reading"),
  );
  const displayTag = tags.some(
    (tag) =>
      tag.includes("/display/") ||
      tag.includes("/purpose/display") ||
      tag.includes("/purpose/headline"),
  );
  if (!authored.length) {
    if (easyReading) {
      scores.body = 90;
      scores.headline = 55;
    }
    if (displayTag) {
      scores.headline = Math.max(scores.headline, 85);
      scores.display = 90;
    }
    const category = cleanText(family?.category).toLocaleLowerCase();
    if (category === "serif" || category === "sans-serif") {
      scores.body = Math.max(scores.body, 45);
      scores.headline = Math.max(scores.headline, 35);
    } else if (category === "display" || category === "handwriting") {
      scores.headline = Math.max(scores.headline, 55);
      scores.display = Math.max(scores.display, 65);
    } else if (category === "monospace") {
      scores.code = Math.max(scores.code, 70);
    }
  }
  return {
    ...scores,
    classified:
      authored.length > 0 ||
      easyReading ||
      displayTag ||
      Object.values(scores).some((score) => score > 0),
  };
}

export function fontMatchesRecommendation(family, role) {
  const normalizedRole = cleanText(role).toLocaleLowerCase();
  return (
    !normalizedRole ||
    normalizedRole === "all" ||
    (FONT_ROLES.has(normalizedRole) &&
      fontRecommendationScores(family)[normalizedRole] > 0)
  );
}

export function fontCapabilities(family) {
  const faces = Array.isArray(family?.faces) ? family.faces : [];
  const axes = faces.flatMap((face) => face.axes || []);
  const tags = new Set(axes.map((axis) => axis.tag));
  return {
    variable: axes.length > 0,
    static: axes.length === 0,
    opticalSize: tags.has("opsz"),
    italic:
      tags.has("ital") ||
      tags.has("slnt") ||
      faces.some((face) => /italic|oblique/i.test(face.style)),
    multipleWeights:
      tags.has("wght") || new Set(faces.map((face) => face.weight)).size > 1,
  };
}

export function normalizeFontFace(face, family = "") {
  const source = typeof face === "string" ? { style: face } : face || {};
  const faceFamily = cleanText(source.family) || cleanText(family);
  const style = cleanText(source.style) || "Regular";
  const fullName = cleanText(source.fullName || source.fullname);
  const postscriptName = cleanText(
    source.postscriptName || source.postScriptName || source.postscript,
  );
  const weight = normalizeWeight(source.weight);
  const stretch = normalizeStretch(source.stretch);
  const axes = Array.isArray(source.axes)
    ? source.axes.map(normalizeFontAxis).filter(Boolean)
    : [];
  const instances = Array.isArray(source.instances)
    ? source.instances
        .map((instance, index) => normalizeFontInstance(instance, axes, index))
        .filter(Boolean)
    : [];
  const id =
    cleanText(source.id) ||
    postscriptName ||
    fullName ||
    `${faceFamily}:${style}:${weight}:${stretch ?? "normal"}`;
  return {
    id,
    family: faceFamily,
    style,
    weight,
    ...(stretch === undefined ? {} : { stretch }),
    ...(fullName ? { fullName } : {}),
    ...(postscriptName ? { postscriptName } : {}),
    ...(cleanText(source.src) ? { src: cleanText(source.src) } : {}),
    ...(cleanText(source.provider) ? { provider: cleanText(source.provider) } : {}),
    axes,
    instances,
  };
}

export function normalizeFontFamily(option, source = "provided") {
  const raw = typeof option === "string" ? { family: option } : option || {};
  const family = cleanText(raw.family || raw.value || raw.label);
  if (!family) return null;
  const familyAxes = Array.isArray(raw.axes)
    ? raw.axes.map(normalizeFontAxis).filter(Boolean)
    : [];
  const faces = Array.isArray(raw.faces) && raw.faces.length
    ? raw.faces.map((face) => {
        const sourceFace =
          typeof face === "string" ? { style: face } : face || {};
        return normalizeFontFace(
          {
            ...sourceFace,
            provider: sourceFace.provider || raw.provider,
            axes:
              Array.isArray(sourceFace.axes) && sourceFace.axes.length
                ? sourceFace.axes
                : familyAxes,
          },
          family,
        );
      })
    : [normalizeFontFace(raw, family)];
  const seen = new Set();
  const uniqueFaces = faces.filter((face) => {
    const key = face.id.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    family,
    label: cleanText(raw.label) || family,
    category: cleanText(raw.category).toLocaleLowerCase(),
    sources: [cleanText(raw.source) || source],
    ...(Number.isFinite(Number(raw.popularity))
      ? { popularity: Number(raw.popularity) }
      : {}),
    ...(Array.isArray(raw.subsets) ? { subsets: [...raw.subsets] } : {}),
    ...(Array.isArray(raw.tags) ? { tags: [...raw.tags] } : {}),
    ...(normalizeFontRoles(raw.roles).length
      ? { roles: normalizeFontRoles(raw.roles) }
      : {}),
    ...(cleanText(raw.previewUrl) ? { previewUrl: cleanText(raw.previewUrl) } : {}),
    ...(cleanText(raw.provider) ? { provider: cleanText(raw.provider) } : {}),
    faces: uniqueFaces,
  };
}

export function normalizeFontOptions(value, source = "provided") {
  let parsed = value;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text.split(text.includes("\n") ? "\n" : ",");
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((entry) => normalizeFontFamily(entry, source))
    .filter(Boolean);
}

export function mergeFontFamilies(...collections) {
  const merged = new Map();
  for (const family of collections.flat()) {
    if (!family?.family) continue;
    const key = family.family.toLocaleLowerCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, {
        ...family,
        sources: [...new Set(family.sources || [])],
        faces: (family.faces || []).map((face) => ({ ...face })),
      });
      continue;
    }
    existing.sources = [...new Set([...existing.sources, ...(family.sources || [])])];
    if (!existing.category && family.category) existing.category = family.category;
    for (const name of [
      "popularity",
      "subsets",
      "tags",
      "previewUrl",
      "provider",
      "roles",
    ]) {
      if (existing[name] === undefined && family[name] !== undefined) {
        existing[name] = Array.isArray(family[name])
          ? [...family[name]]
          : family[name];
      }
    }
    const faceIds = new Set(existing.faces.map((face) => face.id.toLocaleLowerCase()));
    for (const face of family.faces || []) {
      const existingFace = existing.faces.find(
        (candidate) =>
          candidate.id.toLocaleLowerCase() === face.id.toLocaleLowerCase(),
      );
      if (existingFace) {
        if (!existingFace.axes?.length && face.axes?.length) {
          existingFace.axes = face.axes.map((axis) => ({ ...axis }));
        }
        if (!existingFace.instances?.length && face.instances?.length) {
          existingFace.instances = face.instances.map((instance) => ({
            ...instance,
            coordinates: { ...instance.coordinates },
          }));
        }
        if (!existingFace.src && face.src) existingFace.src = face.src;
        if (!existingFace.provider && face.provider) {
          existingFace.provider = face.provider;
        }
        continue;
      }
      faceIds.add(face.id.toLocaleLowerCase());
      existing.faces.push({ ...face });
    }
  }
  return [...merged.values()].sort((left, right) =>
    left.label.localeCompare(right.label, undefined, { sensitivity: "base" }),
  );
}

export function genericFontFamilies() {
  return [
    ["system-ui", "sans-serif"],
    ["sans-serif", "sans-serif"],
    ["serif", "serif"],
    ["monospace", "monospace"],
    ["cursive", "handwriting"],
    ["fantasy", "display"],
  ].map(([family, category]) =>
    normalizeFontFamily({ family, category, source: "generic" }, "generic"),
  );
}

export function normalizeFontPickerValue(value, fallback = { family: "system-ui" }) {
  let source = value;
  if (typeof source === "string") {
    const text = source.trim();
    if (text.startsWith("{")) {
      try {
        source = JSON.parse(text);
      } catch {
        source = { family: text };
      }
    } else {
      source = { family: text };
    }
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    source = fallback;
  }
  const family = cleanText(source.family) || cleanText(fallback?.family) || "system-ui";
  const faceSource = source.face;
  const face =
    faceSource && typeof faceSource === "object"
      ? normalizeFontFace({ ...faceSource, family }, family)
      : null;
  const rawAxes =
    source.axes && typeof source.axes === "object" && !Array.isArray(source.axes)
      ? source.axes
      : {};
  const axes = Object.fromEntries(
    Object.entries(rawAxes)
      .filter(([tag, number]) => tag.length === 4 && Number.isFinite(Number(number)))
      .map(([tag, number]) => [tag, Number(number)]),
  );
  return {
    family,
    ...(face
      ? {
          face: {
            id: face.id,
            style: face.style,
            weight: face.weight,
            ...(face.stretch === undefined ? {} : { stretch: face.stretch }),
            ...(face.fullName ? { fullName: face.fullName } : {}),
            ...(face.postscriptName ? { postscriptName: face.postscriptName } : {}),
          },
        }
      : {}),
    axes,
  };
}

export function serializeFontPickerValue(value) {
  return JSON.stringify(normalizeFontPickerValue(value));
}

export function quoteFontFamily(family) {
  const text = cleanText(family);
  if (!text) return "system-ui";
  if (
    GENERIC_FAMILIES.has(text.toLocaleLowerCase()) ||
    text.includes(",") ||
    /^(['"]).*\1$/.test(text)
  ) {
    return text;
  }
  return `"${text.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

export function fontPickerCss(value) {
  const normalized = normalizeFontPickerValue(value);
  const axes = normalized.axes;
  const face = normalized.face;
  const customAxisEntries = Object.entries(axes).filter(
    ([tag]) => !REGISTERED_AXES.has(tag) || tag === "opsz",
  );
  const weight = axes.wght ?? face?.weight;
  const stretch = axes.wdth ?? face?.stretch;
  const slant = axes.slnt;
  const italic = axes.ital;
  const style =
    Number(italic) >= 0.5
      ? "italic"
      : Number.isFinite(slant)
        ? `oblique ${slant}deg`
        : face?.style?.toLocaleLowerCase().includes("italic")
          ? "italic"
          : "normal";
  return {
    fontFamily: quoteFontFamily(normalized.family),
    fontStyle: style,
    fontWeight: weight === undefined ? "normal" : String(weight),
    fontStretch: stretch === undefined ? "normal" : `${stretch}%`,
    fontOpticalSizing: Object.hasOwn(axes, "opsz") ? "none" : "auto",
    fontVariationSettings: customAxisEntries.length
      ? customAxisEntries
          .map(([tag, number]) => `"${tag}" ${number}`)
          .join(", ")
      : "normal",
  };
}

export function googleFontsStylesheetUrl(value) {
  const normalized = normalizeFontPickerValue(value);
  const family = normalized.family.replace(/\s+/g, "+");
  const axes = Object.entries(normalized.axes || {})
    .filter(([tag, number]) => tag.length === 4 && Number.isFinite(number))
    .sort(([left], [right]) => left.localeCompare(right));
  const italic = normalized.face?.style?.toLocaleLowerCase().includes("italic");
  const weight = normalized.face?.weight || 400;
  let query = family;
  if (axes.length) {
    query += `:${axes.map(([tag]) => tag).join(",")}@${axes
      .map(([, number]) => number)
      .join(",")}`;
  } else if (italic) {
    query += `:ital,wght@1,${weight}`;
  } else if (weight !== 400) {
    query += `:wght@${weight}`;
  }
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(query).replaceAll("%2B", "+")}&display=swap`;
}

export function applyFontPickerCss(element, value) {
  if (!element) return;
  const css = fontPickerCss(value);
  Object.assign(element.style, css);
}

function readTag(view, offset) {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

function readFixed(view, offset) {
  return view.getInt32(offset, false) / 65536;
}

function boundsCheck(offset, length, total) {
  if (
    !Number.isInteger(offset) ||
    !Number.isInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset + length > total
  ) {
    throw new RangeError("Invalid OpenType table bounds");
  }
}

function decodeUtf16Be(bytes) {
  let value = "";
  for (let index = 0; index + 1 < bytes.length; index += 2) {
    value += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
  }
  return value;
}

function decodeName(bytes, platformId, encodingId) {
  if (platformId === 0 || platformId === 3) return decodeUtf16Be(bytes);
  try {
    return new TextDecoder(encodingId === 0 ? "macintosh" : "utf-8").decode(bytes);
  } catch {
    return new TextDecoder().decode(bytes);
  }
}

function parseNameTable(view, table) {
  boundsCheck(table.offset, table.length, view.byteLength);
  if (table.length < 6) return new Map();
  const count = view.getUint16(table.offset + 2, false);
  const stringOffset = view.getUint16(table.offset + 4, false);
  boundsCheck(table.offset + 6, count * 12, table.offset + table.length);
  const candidates = new Map();
  for (let index = 0; index < count; index += 1) {
    const record = table.offset + 6 + index * 12;
    const platformId = view.getUint16(record, false);
    const encodingId = view.getUint16(record + 2, false);
    const languageId = view.getUint16(record + 4, false);
    const nameId = view.getUint16(record + 6, false);
    const length = view.getUint16(record + 8, false);
    const offset = table.offset + stringOffset + view.getUint16(record + 10, false);
    try {
      boundsCheck(offset, length, table.offset + table.length);
    } catch {
      continue;
    }
    const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
    const text = decodeName(bytes, platformId, encodingId).replace(/\0/g, "").trim();
    if (!text) continue;
    const score =
      (platformId === 3 ? 8 : platformId === 0 ? 6 : 2) +
      (languageId === 0x0409 ? 4 : languageId === 0 ? 2 : 0);
    const existing = candidates.get(nameId);
    if (!existing || score > existing.score) candidates.set(nameId, { text, score });
  }
  return new Map([...candidates].map(([id, entry]) => [id, entry.text]));
}

/**
 * Parse names and variable axes from an uncompressed SFNT/OTF font.
 * WOFF/WOFF2 deliberately return an empty result; callers can supply metadata.
 */
export function parseOpenTypeFont(input) {
  const buffer =
    input instanceof ArrayBuffer
      ? input
      : ArrayBuffer.isView(input)
        ? input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
        : null;
  if (!buffer || buffer.byteLength < 12 || buffer.byteLength > MAX_FONT_BYTES) {
    throw new TypeError("Unsupported or oversized font data");
  }
  const view = new DataView(buffer);
  const containerSignature = readTag(view, 0);
  let directoryOffset = 0;
  if (containerSignature === "ttcf") {
    if (view.byteLength < 16 || view.getUint32(8, false) < 1) {
      throw new TypeError("Empty TrueType collection");
    }
    directoryOffset = view.getUint32(12, false);
    boundsCheck(directoryOffset, 12, view.byteLength);
  }
  const signature = readTag(view, directoryOffset);
  if (signature === "wOFF" || signature === "wOF2") {
    return { format: signature === "wOF2" ? "woff2" : "woff", names: {}, axes: [], instances: [] };
  }
  const sfntVersion = view.getUint32(directoryOffset, false);
  if (
    sfntVersion !== 0x00010000 &&
    !["OTTO", "true", "typ1"].includes(signature)
  ) {
    throw new TypeError("Unsupported OpenType signature");
  }
  const tableCount = view.getUint16(directoryOffset + 4, false);
  boundsCheck(directoryOffset + 12, tableCount * 16, view.byteLength);
  const tables = new Map();
  for (let index = 0; index < tableCount; index += 1) {
    const record = directoryOffset + 12 + index * 16;
    const tag = readTag(view, record);
    const offset = view.getUint32(record + 8, false);
    const length = view.getUint32(record + 12, false);
    boundsCheck(offset, length, view.byteLength);
    tables.set(tag, { offset, length });
  }
  const names = tables.has("name") ? parseNameTable(view, tables.get("name")) : new Map();
  const axes = [];
  const instances = [];
  const fvar = tables.get("fvar");
  if (fvar && fvar.length >= 16) {
    const base = fvar.offset;
    const axesOffset = view.getUint16(base + 4, false);
    const axisCount = view.getUint16(base + 8, false);
    const axisSize = view.getUint16(base + 10, false);
    const instanceCount = view.getUint16(base + 12, false);
    const instanceSize = view.getUint16(base + 14, false);
    if (
      axisSize < 20 ||
      instanceSize < 4 + axisCount * 4 ||
      axisCount > 64 ||
      instanceCount > 4096
    ) {
      throw new RangeError("Invalid OpenType variation records");
    }
    boundsCheck(base + axesOffset, axisCount * axisSize, base + fvar.length);
    for (let index = 0; index < axisCount; index += 1) {
      const record = base + axesOffset + index * axisSize;
      const axis = normalizeFontAxis({
        tag: readTag(view, record),
        min: readFixed(view, record + 4),
        default: readFixed(view, record + 8),
        max: readFixed(view, record + 12),
        name: names.get(view.getUint16(record + 18, false)),
      });
      if (axis) axes.push(axis);
    }
    const instancesOffset = base + axesOffset + axisCount * axisSize;
    boundsCheck(instancesOffset, instanceCount * instanceSize, base + fvar.length);
    for (let index = 0; index < instanceCount; index += 1) {
      const record = instancesOffset + index * instanceSize;
      const coordinates = {};
      for (let axisIndex = 0; axisIndex < axes.length; axisIndex += 1) {
        coordinates[axes[axisIndex].tag] = readFixed(view, record + 4 + axisIndex * 4);
      }
      instances.push({
        name: names.get(view.getUint16(record, false)) || `Instance ${index + 1}`,
        coordinates,
      });
    }
  }
  return {
    format:
      containerSignature === "ttcf"
        ? "ttc"
        : signature === "OTTO"
          ? "otf"
          : "ttf",
    names: Object.fromEntries(names),
    axes,
    instances,
  };
}
