import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { figui3Sections } from "../../playground/src/data/figui3Sections";
import {
  propkitMigration,
  type PropsKitMigrationEntry,
} from "../../playground/src/data/propkitMigration";
import { legacyPropsKitSections } from "../../playground/src/data/sections";
import { sortSectionsWithinGroups } from "../../playground/src/lib/sectionOrder";
import {
  controlAttributeRules,
  getSplitInputTypePreset,
} from "../../playground/src/lib/attributeRules";
import {
  INSTALL_COMMAND,
  INSTALL_PROMPT,
} from "../../playground/src/lib/installPrompt";
import {
  landscapeUrl,
  portraitUrl,
  squareUrl,
} from "../../playground/src/lib/images";
import { labSections } from "../../playground/src/data/labSections";
import { propskitSections } from "../../playground/src/data/propskitSections";
import { moduleSections } from "../../playground/src/data/moduleSections";
import { allComponentContracts } from "../../playground/src/testing/componentManifest";
import {
  CSS_PROPERTY_MODULES,
  createCssModuleConfig,
} from "../../css-properties.js";

function markupTags(value: unknown, tags = new Set<string>()) {
  if (Array.isArray(value)) {
    value.forEach((entry) => markupTags(entry, tags));
    return tags;
  }
  if (!value || typeof value !== "object") return tags;
  for (const [key, entry] of Object.entries(value)) {
    if (key === "markup" && typeof entry === "string") {
      for (const match of entry.matchAll(/<((?:fig)-[a-z0-9-]+)/g)) {
        tags.add(match[1]);
      }
    } else {
      markupTags(entry, tags);
    }
  }
  return tags;
}

test("installation prompt points agents to packaged Cursor skills", () => {
  expect(INSTALL_COMMAND).toBe("npm i @rogieking/figui3");
  expect(INSTALL_PROMPT).toContain(
    "node_modules/@rogieking/figui3/.cursor/skills/",
  );
  for (const skill of ["figui3", "fig-editor", "fig-lab", "propskit"]) {
    expect(INSTALL_PROMPT).toContain(`${skill}/SKILL.md`);
  }
  expect(INSTALL_PROMPT).toContain(
    "does not automatically discover skills inside node_modules",
  );
  expect(INSTALL_PROMPT).not.toContain("playground");
  expect(INSTALL_PROMPT).not.toContain("propkit/SKILL.md");
});

test("generated playground images use fixed Unsplash CDN assets", () => {
  const urls = [portraitUrl(), landscapeUrl(), squareUrl()];
  for (const value of urls) {
    const url = new URL(value);
    expect(url.origin).toBe("https://images.unsplash.com");
    expect(url.pathname).toMatch(/^\/photo-/);
    expect(url.searchParams.get("fit")).toBe("crop");
    expect(url.searchParams.get("w")).toBe("320");
    expect(url.searchParams.get("h")).toMatch(/^(180|320|400)$/);
  }
});

test("playground examples do not depend on Picsum", () => {
  const propskitExamples = propskitSections.flatMap((section) =>
    section.examples.map((example) => ({
      markup: example.markup,
      config: example.createConfig(),
    })),
  );
  expect(
    JSON.stringify([
      figui3Sections,
      legacyPropsKitSections,
      labSections,
      propskitExamples,
      allComponentContracts,
    ]),
  ).not.toContain("picsum.photos");
});

test("playground control tags have attribute rules or an explicit exclusion", () => {
  const intentionalWithoutControls = new Set([
    "fig-ai-context",
    "fig-ai-prompt",
    "fig-attachments",
    "fig-content",
    "fig-footer",
    "fig-header",
    "fig-icon",
    "fig-input-combo",
    "fig-menu-separator",
    "fig-segment",
    "fig-select-option",
    "fig-select-options",
    "fig-separator",
    "fig-spinner",
    "fig-tab-content",
    "fig-toolbelt-group",
  ]);
  const tags = markupTags([figui3Sections, labSections]);
  const missing = [...tags]
    .filter(
      (tag) =>
        !(tag in controlAttributeRules) &&
        !intentionalWithoutControls.has(tag),
    )
    .sort();
  expect(missing).toEqual([]);
});

test("button combos expose a reduced nested-button variant control", () => {
  expect(controlAttributeRules["fig-button-combo"]?.variant).toEqual({
    label: "Variant",
    type: "enum",
    options: ["", "secondary", "input", "overlay"],
  });
});

test("CSS property modules preserve exact keys and friendly labels", () => {
  expect(moduleSections.map((section) => section.name)).toEqual([
    "Layout",
    "Typography",
    "Fills",
    "Border",
    "Stroke",
    "Outline",
    "Filters",
    "Shadow",
    "Transforms",
    "Appearance",
  ]);
  const mappings = CSS_PROPERTY_MODULES.flatMap((module) => module.properties);
  expect(new Set(mappings.map((mapping) => mapping.property)).size).toBe(
    mappings.length,
  );
  expect(
    mappings.find((mapping) => mapping.property === "font-family")?.label,
  ).toBe("Font family");
  expect(
    mappings.find((mapping) => mapping.property === "stroke-width")?.label,
  ).toBe("SVG stroke width");
  expect(mappings.some((mapping) => mapping.property === "font-face")).toBe(
    false,
  );
});

test("element-free CSS modules expose every mapped property", () => {
  for (const module of CSS_PROPERTY_MODULES) {
    const result = createCssModuleConfig(module.id);
    expect(result.mode).toBe("unconstrained");
    expect(Object.keys(result.config)).toHaveLength(module.properties.length);
    expect(
      result.capabilities.every(
        (capability) => capability.status === "applicable",
      ),
    ).toBe(true);
  }
});

async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a playground test port"));
        return;
      }
      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

async function waitForServer(
  url: string,
  process: ChildProcess,
  getOutput: () => string,
) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      throw new Error(`Playground server exited early:\n${getOutput()}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out starting playground server:\n${getOutput()}`);
}

async function mountExampleView(page: Page, markup: string) {
  await page.goto(`${playgroundUrl}/propskit/lab`);
  await page.evaluate(async (initialMarkup) => {
    await customElements.whenDefined("fig-input-slider");
    const [
      { default: ExampleView },
      ReactModule,
      ReactDOMClientModule,
      ReactDOMModule,
    ] =
      await Promise.all([
        import("/src/components/ExampleView.tsx"),
        import("/@id/react"),
        import("/@id/react-dom/client"),
        import("/@id/react-dom"),
      ]);
    const React = ReactModule.default ?? ReactModule;
    const ReactDOMClient =
      ReactDOMClientModule.default ?? ReactDOMClientModule;
    const ReactDOM = ReactDOMModule.default ?? ReactDOMModule;
    const host = document.createElement("div");
    host.dataset.exampleHarness = "true";
    document.body.append(host);
    const root = ReactDOMClient.createRoot(host);
    const dialogStates: boolean[] = [];
    let currentMarkup = initialMarkup;
    let syncDialogMarkup = false;

    const render = (nextMarkup = currentMarkup) => {
      currentMarkup = nextMarkup;
      ReactDOM.flushSync(() => {
        root.render(
          React.createElement(ExampleView, {
            example: {
              id: "state-machine-regression",
              name: "State machine regression",
              markup: currentMarkup,
            },
            markup: currentMarkup,
            onPersistDialogOpenState: (
              _fieldIndex: number,
              isOpen: boolean,
            ) => {
              dialogStates.push(isOpen);
              if (!syncDialogMarkup) return;
              const template = document.createElement("template");
              template.innerHTML = currentMarkup;
              const dialog = template.content.querySelector(
                'dialog[is="fig-dialog"]',
              );
              if (!dialog) return;
              dialog.toggleAttribute("open", isOpen);
              render(template.innerHTML);
            },
          }),
        );
      });
    };

    render();
    (window as any).__exampleViewHarness = {
      dialogStates,
      getMarkup: () => currentMarkup,
      render,
      setDialogSync: (enabled: boolean) => {
        syncDialogMarkup = enabled;
      },
    };
  }, markup);
  await expect(
    page.locator('[data-example-harness="true"] .propkit-example'),
  ).toHaveCount(1);
}

let playgroundUrl = "";

function sourceKeys(): string[] {
  return legacyPropsKitSections.flatMap((section) =>
    section.examples.map((example) => `${section.id}/${example.id}`),
  );
}

function targetKey(migration: PropsKitMigrationEntry): string {
  return `${migration.sectionId}/${migration.exampleId}`;
}

test.describe("PropsKit playground migration", () => {
  test("maps every old example to an existing FigUI3 example", () => {
    const oldKeys = sourceKeys();
    const targetKeys = new Set(
      figui3Sections.flatMap((section) =>
        section.examples.map((example) => `${section.id}/${example.id}`),
      ),
    );

    expect(legacyPropsKitSections).toHaveLength(54);
    expect(oldKeys).toHaveLength(123);
    expect(Object.keys(propkitMigration).sort()).toEqual(oldKeys.sort());
    for (const oldKey of oldKeys) {
      expect(
        targetKeys.has(targetKey(propkitMigration[oldKey])),
        `${oldKey} should map to an existing FigUI3 example`,
      ).toBe(true);
    }
  });

  test("does not collapse distinct old examples without marking duplicates", () => {
    const oldKeysByTarget = new Map<
      string,
      Array<{ oldKey: string; duplicate: boolean }>
    >();

    for (const [oldKey, migration] of Object.entries(propkitMigration)) {
      const key = targetKey(migration);
      const entries = oldKeysByTarget.get(key) ?? [];
      entries.push({ oldKey, duplicate: migration.duplicate === true });
      oldKeysByTarget.set(key, entries);
    }

    for (const [target, entries] of oldKeysByTarget) {
      if (entries.length < 2) continue;
      expect(
        entries.every((entry) => entry.duplicate),
        `${entries.map((entry) => entry.oldKey).join(", ")} all map to ${target}`,
      ).toBe(true);
    }
  });

  test("keeps section and example ids unique", () => {
    const sectionIds = figui3Sections.map((section) => section.id);
    expect(new Set(sectionIds).size).toBe(sectionIds.length);

    for (const section of figui3Sections) {
      const exampleIds = section.examples.map((example) => example.id);
      expect(
        new Set(exampleIds).size,
        `${section.id} has duplicate example ids`,
      ).toBe(exampleIds.length);
    }
  });

  test("places the large toolbelt after default with wrapped split buttons", () => {
    const toolbelt = sortSectionsWithinGroups(figui3Sections).find(
      (section) => section.id === "toolbelt",
    );
    expect(toolbelt?.examples.slice(0, 2).map((example) => example.id)).toEqual([
      "default",
      "large",
    ]);
    const largeMarkup = toolbelt?.examples[1]?.markup ?? "";
    expect(largeMarkup).toContain("<fig-toolbelt");
    expect(
      [...largeMarkup.matchAll(/<fig-button-combo\b/g)],
    ).toHaveLength(0);
    expect(
      [...largeMarkup.matchAll(/<fig-toolbelt-item\b/g)],
    ).toHaveLength(8);
    expect(
      [...largeMarkup.matchAll(/<fig-tooltip\b/g)],
    ).toHaveLength(8);
    expect(
      [...largeMarkup.matchAll(/<fig-menu(?:\s|>)/g)],
    ).toHaveLength(8);
    const values = [
      ...largeMarkup.matchAll(/<fig-button\b[^>]*\bvalue="([^"]+)"/g),
    ].map((match) => match[1]);
    expect(values).toHaveLength(8);
    expect(new Set(values).size).toBe(values.length);
    expect(
      [...largeMarkup.matchAll(/<fig-button\b[^>]*\bsize="large"/g)],
    ).toHaveLength(16);
  });

  test("orders common inputs before specialized controls", () => {
    const inputIds = sortSectionsWithinGroups(figui3Sections)
      .filter((section) => section.group === "Inputs")
      .map((section) => section.id);

    expect(inputIds).toEqual([
      "text-input",
      "number-input",
      "checkbox",
      "radio",
      "switch",
      "button",
      "button-combo",
      "dropdown",
      "segmented-control",
      "slider",
      "file-input",
      "color",
      "fill-input",
      "split-input",
      "input-combo",
      "options",
      "chooser",
      "palette",
      "gradient",
      "angle",
      "origin-grid",
      "joystick",
      "3d-rotate",
      "easing",
    ]);
  });

  test("groups navigation and container components together", () => {
    const navigationIds = figui3Sections
      .filter((section) => section.group === "Navigation & Containers")
      .map((section) => section.id)
      .sort();

    expect(navigationIds).toEqual([
      "content",
      "footer",
      "group",
      "header",
      "tabs",
      "toolbelt",
    ]);
  });

  test("groups dialogs, menus, and popups together", () => {
    const overlayIds = figui3Sections
      .filter((section) => section.group === "Dialogs, Menus & Popups")
      .map((section) => section.id)
      .sort();

    expect(overlayIds).toEqual(["dialog", "menu", "popup", "tooltip"]);
  });

  test("groups load indicators together", () => {
    const loadingIds = figui3Sections
      .filter((section) => section.group === "Load indicators")
      .map((section) => section.id)
      .sort();

    expect(loadingIds).toEqual([
      "button-play",
      "shimmer",
      "skeleton",
      "spinner",
    ]);

    const orderedLoadingIds = sortSectionsWithinGroups(figui3Sections)
      .filter((section) => section.group === "Load indicators")
      .map((section) => section.id);
    expect(orderedLoadingIds.at(-1)).toBe("button-play");
  });

  test('names default field compositions "Label + input"', () => {
    const labelInputExamples = figui3Sections.flatMap((section) =>
      section.examples
        .filter((example) => example.name === "Label + input")
        .map((example) => `${section.id}/${example.id}`),
    );
    const oldDefaultFieldNames = figui3Sections.flatMap((section) =>
      section.examples.filter((example) => example.name === "Default (field)"),
    );

    expect(labelInputExamples).toHaveLength(6);
    expect(oldDefaultFieldNames).toHaveLength(0);
  });
});

test("split input type control uses matching example presets", () => {
  const numberPreset = getSplitInputTypePreset("number");
  expect(numberPreset).toMatchObject({
    options: "2,4,8,16,32",
    placeholder: "Padding",
  });
  expect(numberPreset.values).toEqual(new Set(["2", "4", "8", "16", "32"]));

  const textPreset = getSplitInputTypePreset("text");
  expect(textPreset).toMatchObject({
    options: "House, Apartment, Condo, Townhouse, Other",
    placeholder: "Type of residence",
  });
  expect(textPreset.values).toEqual(
    new Set(["House", "Apartment", "Condo", "Townhouse", "Other"]),
  );
});

test("audio waveform exposes bar and ribbon variants", () => {
  expect(controlAttributeRules["fig-audio"]?.variant).toEqual({
    label: "Waveform",
    type: "enum",
    options: ["bars", "ribbon"],
  });
  expect(controlAttributeRules["fig-audio-waveform"]?.variant).toEqual({
    label: "Variant",
    type: "enum",
    options: ["bars", "ribbon"],
  });
  const section = figui3Sections.find(
    (entry) => entry.id === "audio-waveform",
  );
  expect(section?.examples.map((example) => example.id)).toEqual([
    "default",
    "ribbon",
  ]);
  expect(
    section?.examples.find((example) => example.id === "ribbon")?.markup,
  ).toContain('variant="ribbon"');
});

test("PropsKit media splits image, video, and audio examples", () => {
  const section = propskitSections.find(
    (entry) => entry.id === "propskit-media",
  );
  expect(section?.examples.map((example) => example.name)).toEqual([
    "Image (empty)",
    "Image",
    "Images",
    "Video (empty)",
    "Video",
    "Videos",
    "Audio (empty)",
    "Audio (with URL)",
  ]);
  const sortedSection = sortSectionsWithinGroups(propskitSections).find(
    (entry) => entry.id === "propskit-media",
  );
  expect(sortedSection?.examples.map((example) => example.name)).toEqual([
    "Audio (empty)",
    "Audio (with URL)",
    "Image (empty)",
    "Image",
    "Images",
    "Video (empty)",
    "Video",
    "Videos",
  ]);
  expect(
    section?.examples.find((example) => example.id === "images")?.markup,
  ).toContain('type: "image"');
  expect(
    section?.examples.find((example) => example.id === "videos")?.markup,
  ).toContain('type: "video"');
  expect(
    section?.examples.find((example) => example.id === "audio-empty")
      ?.createConfig(),
  ).toEqual({
    audio: { type: "audio" },
  });
  expect(
    section?.examples.find((example) => example.id === "audio-url")?.markup,
  ).toContain(
    "https://samplelib.com/mp3/sample-15s.mp3",
  );
});

test("Carousel is the final section in the Media group", () => {
  const mediaSections = sortSectionsWithinGroups(figui3Sections).filter(
    (section) => section.group === "Media",
  );
  expect(mediaSections.at(-1)?.id).toBe("carousel");
  expect(controlAttributeRules["fig-carousel"]).toMatchObject({
    index: { type: "number" },
    autoplay: { type: "boolean", defaultChecked: true },
    duration: { type: "number", units: "s" },
    loop: { type: "boolean" },
    navigation: { type: "enum", options: ["buttons", "dots"] },
    progress: { type: "boolean", defaultChecked: true },
  });
});

test("disabled components expose an Attributes view toggle", () => {
  const auditedControls = [
    "fig-input-number",
    "fig-segmented-control",
    "fig-angle",
    "fig-layer",
    "fig-chooser",
    "fig-menu-item",
  ];

  for (const tag of auditedControls) {
    expect(controlAttributeRules[tag]?.disabled).toMatchObject({
      label: "Disabled",
      type: "boolean",
      boolMode: "presence",
    });
  }

  expect(Object.keys(controlAttributeRules["fig-input-number"]).at(-1)).toBe(
    "disabled",
  );
});

test("property exposes selected without experimental activation controls", () => {
  expect(controlAttributeRules["fig-property"]?.activation).toBeUndefined();
  expect(controlAttributeRules["fig-property"]?.selected).toEqual({
    label: "Selected",
    type: "boolean",
    boolMode: "presence",
  });
  expect(controlAttributeRules["fig-property"]?.full).toBeUndefined();
});

test("group exposes a selector-based toggle target", () => {
  expect(controlAttributeRules["fig-group"]?.["toggle-target"]).toEqual({
    label: "Toggle target",
    type: "string",
    placeholder: ".group-toggle",
  });
});

test("swatch exposes a full-width toggle", () => {
  expect(controlAttributeRules["fig-swatch"]?.full).toEqual({
    label: "Full",
    type: "boolean",
    boolMode: "presence",
  });
});

test("property controls expose authored default attributes", () => {
  expect(controlAttributeRules["fig-input-number"]?.default).toMatchObject({
    label: "Default",
    type: "number",
  });
  expect(controlAttributeRules["fig-switch"]?.["default-checked"]).toMatchObject({
    label: "Default checked",
    type: "boolean",
  });
  expect(controlAttributeRules["fig-input-point"]?.["default-x"]).toMatchObject({
    label: "Default X",
    type: "number",
  });
  expect(controlAttributeRules["fig-input-rotate"]?.["default-z"]).toMatchObject({
    label: "Default Z",
    type: "number",
  });
  expect(controlAttributeRules["fig-input-file"]?.["default-url"]).toMatchObject({
    label: "Default URL",
    type: "string",
  });
  expect(controlAttributeRules["fig-input-rotate"]?.variant).toMatchObject({
    label: "Variant",
    type: "enum",
    options: ["default", "simple"],
  });
  const rotateSection = figui3Sections.find(
    (section) => section.id === "input-rotate",
  );
  expect(
    rotateSection?.examples.find((example) => example.id === "simple")?.markup,
  ).toContain('<fig-input-rotate variant="simple"');
});

test("property exposes ratio controls and examples", () => {
  expect(controlAttributeRules["fig-property"]?.ratio).toEqual({
    label: "Ratio",
    type: "string",
    options: ["1:3", "1:2", "2:3", "1:1"],
    placeholder: "1:2",
    defaultValue: "1:2",
  });
  const section = figui3Sections.find((entry) => entry.id === "property");
  const example = section?.examples.find((entry) => entry.id === "ratio");
  expect(example).toMatchObject({ name: "Ratio" });
  expect(example?.markup).toContain('ratio="1:2"');
  expect(example?.markup).toContain('ratio="1:1"');
  expect(example?.markup).toContain('ratio="2:3"');
});

test("property all-properties example covers every supported control", () => {
  const section = figui3Sections.find((entry) => entry.id === "property");
  const example = section?.examples.find(
    (entry) => entry.id === "all-properties",
  );
  const rowSection = labSections.find((entry) => entry.id === "property");
  const labDefault = rowSection?.examples.find(
    (entry) => entry.id === "default",
  );
  const rowExample = rowSection?.examples.find(
    (entry) => entry.id === "all-properties-row",
  );
  const controlTags = [
    "fig-input-number",
    "fig-slider",
    "fig-input-text",
    "fig-switch",
    "fig-input-color",
    "fig-select",
    "fig-input-point",
    "fig-easing-curve",
    "fig-input-gradient",
    "fig-input-palette",
    "fig-input-rotate",
    "fig-input-file",
  ];
  const sliderVariantTags = [
    "fig-input-slider-hue",
    "fig-input-slider-opacity",
    "fig-input-slider-delta",
    "fig-input-slider-stepper",
    "fig-input-slider-wheel",
  ];

  expect(example).toMatchObject({ name: "All properties" });
  expect(rowExample).toMatchObject({
    name: "All properties",
  });
  for (const tag of controlTags) {
    expect(example?.markup).toContain(`<${tag}`);
    expect(rowExample?.markup).toContain(
      `<${tag === "fig-slider" ? "fig-input-slider" : tag}`,
    );
  }
  for (const tag of sliderVariantTags) {
    expect(rowExample?.markup).toContain(`<${tag}`);
  }
  for (const tag of ["fig-input-slider", ...sliderVariantTags]) {
    expect(rowExample?.markup).toMatch(
      new RegExp(
        `<${tag}\\b[^>]*\\bdefault=["'][^"']*["'][^>]*>[\\s\\S]*?<fig-input-number\\b[^>]*\\bdefault=["'][^"']*["'][^>]*>[\\s\\S]*?</${tag}>`,
      ),
    );
  }
  expect(rowExample?.markup).toContain(
    '<fig-property label="Time" activation="row">',
  );
  expect(rowExample?.markup).toContain(
    '<fig-input-number value="0" default="0" step="1" units="s"></fig-input-number>',
  );
  expect(rowExample?.markup).toContain(
    '<fig-input-file slot="input" label="Choose file" default-url="" default-filename="" full>',
  );
  for (const matchingDefault of [
    'value="16" default="16"',
    'value="Hello" default="Hello"',
    "checked default-checked",
    'value="#0D99FF" default="#0D99FF"',
    'value="Medium" default="Medium"',
    'x="24" y="16" default-x="24" default-y="16"',
    'default=\'["#0D99FF","#14AE5C","#FFCD29","#FF7262","#9747FF"]\'',
  ]) {
    expect(rowExample?.markup).toContain(matchingDefault);
  }
  const rowGradient =
    rowExample?.markup.match(/<fig-input-gradient\b[^>]*>/)?.[0] ?? "";
  expect(rowGradient.match(/\bvalue='([^']*)'/)?.[1]).toBe(
    rowGradient.match(/\bdefault='([^']*)'/)?.[1],
  );
  const rowProperties =
    rowExample?.markup.match(/<fig-property\b[^>]*>/g) ?? [];
  expect(rowProperties).toHaveLength(
    controlTags.length + sliderVariantTags.length + 1,
  );
  expect(
    rowProperties.every((property) =>
      property.includes('activation="row"'),
    ),
  ).toBe(true);
  expect(rowExample?.markup).toContain(
    '<fig-property label="Audio" activation="row">',
  );
  expect(rowExample?.markup).toContain(
    'accepts="audio/*" label="Choose audio" preview url="https://samplelib.com/mp3/sample-15s.mp3"',
  );
  expect(section?.examples.map((entry) => entry.id)).toEqual([
    "default",
    "multiline",
    "ratio",
    "all-properties",
    "custom-accessory",
  ]);
  expect(rowSection).toMatchObject({
    name: "Property",
    group: "Misc",
  });
  expect(labDefault?.markup).toContain(
    '<fig-property label="Number" activation="row">',
  );
  expect(rowSection?.examples.map((entry) => entry.id)).toEqual([
    "default",
    "angle",
    "slider",
    "string",
    "boolean",
    "color",
    "select",
    "point",
    "easing",
    "gradient",
    "palette",
    "rotate",
    "file",
    "audio",
    "all-properties-row",
  ]);
  const individualControls = [
    ["default", "Number", "fig-input-number"],
    ["angle", "Angle", "fig-input-number"],
    ["slider", "Slider", "fig-input-slider"],
    ["string", "String", "fig-input-text"],
    ["boolean", "Boolean", "fig-switch"],
    ["color", "Color", "fig-input-color"],
    ["select", "Select", "fig-select"],
    ["point", "Point", "fig-input-point"],
    ["easing", "Easing", "fig-easing-curve"],
    ["gradient", "Gradient", "fig-input-gradient"],
    ["palette", "Palette", "fig-input-palette"],
    ["rotate", "3D Rotate", "fig-input-rotate"],
    ["file", "File", "fig-input-file"],
    ["audio", "Audio", "fig-input-file"],
  ] as const;
  for (const [id, name, tag] of individualControls) {
    const controlExample = rowSection?.examples.find(
      (entry) => entry.id === id,
    );
    expect(controlExample).toMatchObject({ name });
    expect(controlExample?.markup).toContain(
      `<fig-property label="${name}" activation="row">`,
    );
    expect(controlExample?.markup).toContain(`<${tag} slot="input"`);
  }
  const sliderExample = rowSection?.examples.find(
    (entry) => entry.id === "slider",
  );
  expect(sliderExample?.markup).toContain("<fig-input-number");
  expect(sliderExample?.markup).not.toContain("occlusion-targets");
  expect(
    rowSection?.examples.find((entry) => entry.id === "rotate")?.markup,
  ).toContain('<fig-input-rotate slot="input" variant="default"');
});

test("input slider variants live in the Lab Inputs group", () => {
  const section = labSections.find((entry) => entry.id === "input-slider");
  const tags = [
    "fig-input-slider",
    "fig-input-slider-hue",
    "fig-input-slider-opacity",
    "fig-input-slider-delta",
    "fig-input-slider-stepper",
    "fig-input-slider-wheel",
  ];

  expect(section).toMatchObject({
    name: "Input Slider",
    group: "Inputs",
  });
  expect(section?.examples.map((example) => example.id)).toEqual([
    "default",
    "with-number",
    "hue",
    "opacity",
    "delta",
    "stepper",
    "wheel",
  ]);
  expect(
    section?.examples.find((example) => example.id === "with-number")?.markup,
  ).toContain("<fig-input-number");
  for (const tag of tags) {
    expect(
      section?.examples.some((example) =>
        example.markup.includes(`<${tag}`),
      ),
    ).toBe(true);
    expect(controlAttributeRules[tag]).toBeDefined();
    expect(
      figui3Sections.some((stableSection) =>
        stableSection.examples.some((example) =>
          example.markup.includes(`<${tag}`),
        ),
      ),
    ).toBe(false);
  }
  expect(
    controlAttributeRules["fig-input-slider"]["occlusion-targets"],
  ).toMatchObject({
    label: "Occlusion targets",
    type: "string",
  });
  expect(
    controlAttributeRules["fig-input-slider-hue"].color,
  ).toMatchObject({
    label: "Color",
    type: "color",
  });
  expect(
    controlAttributeRules["fig-input-slider-hue"]["color-space"],
  ).toEqual({
    label: "Color space",
    type: "enum",
    options: [
      "srgb",
      "srgb-linear",
      "display-p3",
      "oklab",
      "oklch",
      "hsl",
    ],
  });
  expect(
    controlAttributeRules["fig-input-slider-opacity"].color,
  ).toMatchObject({
    label: "Color",
    type: "color",
    defaultValue: "#808080",
  });
});

test("palette editor exposes maximum and overflow controls", () => {
  const section = figui3Sections.find(
    (entry) => entry.id === "palette-editor",
  );
  expect(section?.examples.some((example) => example.id === "default")).toBe(
    true,
  );
  expect(controlAttributeRules["fig-palette-editor"]?.max).toMatchObject({
    label: "Max",
    type: "number",
    min: 2,
    step: 1,
  });
  expect(controlAttributeRules["fig-palette-editor"]?.overflow).toEqual({
    label: "Overflow",
    type: "enum",
    options: ["fade", "visible"],
  });
  expect(controlAttributeRules["fig-palette-editor"]?.["show-rows"]).toEqual({
    label: "Show rows",
    type: "number",
    min: 0.5,
    step: 0.5,
  });
});

test("gradient editor exposes stop overflow controls", () => {
  expect(controlAttributeRules["fig-gradient-editor"]?.overflow).toEqual({
    label: "Overflow",
    type: "enum",
    options: ["fade", "visible"],
  });
  expect(controlAttributeRules["fig-gradient-editor"]?.["show-rows"]).toEqual({
    label: "Show rows",
    type: "number",
    min: 0.5,
    step: 0.5,
  });
});

test("slider exposes an optional default control", () => {
  expect(controlAttributeRules["fig-slider"]?.default).toEqual({
    label: "Default",
    type: "number",
  });
});

test("slider examples author logical defaults", () => {
  const sliderSection = figui3Sections.find(
    (section) => section.id === "slider",
  );
  expect(
    Object.fromEntries(
      (sliderSection?.examples ?? []).map((example) => [
        example.id,
        example.markup.match(/\bdefault="([^"]+)"/)?.[1] ?? null,
      ]),
    ),
  ).toEqual({
    "range": "50",
    "range-propskit": "50",
    "opacity-with-text": "100",
    "opacity-with-text-propskit": "100",
    "hue-with-text": "180",
    "hue-with-text-propskit": "180",
    "stepper-with-text": "50",
    "stepper-with-text-propskit": "50",
    "delta-with-text": "0",
    "delta-with-text-propskit": "0",
  });
});

test("reorder examples live with editor components, not lab", () => {
  expect(
    figui3Sections.find((section) => section.id === "reorder"),
  ).toMatchObject({
    group: "Editor components",
    examples: [
      { id: "default", name: "Rows" },
      { id: "groups", name: "Groups" },
    ],
  });
  expect(labSections.some((section) => section.id === "reorder")).toBe(false);
});

test("gradient editor follows palette editor in navigation", () => {
  const editorIds = sortSectionsWithinGroups(figui3Sections)
    .filter((section) => section.group === "Editor components")
    .map((section) => section.id);
  const paletteIndex = editorIds.indexOf("palette-editor");
  expect(paletteIndex).toBeGreaterThanOrEqual(0);
  expect(editorIds[paletteIndex + 1]).toBe("gradient-editor");
});

test("PropsKit examples form the Getting started navigation group", () => {
  expect(propskitSections.map((section) => section.id)).toEqual([
    "quick-start",
    "numbers",
    "colors",
    "toggles",
    "text",
    "groups",
    "propskit-media",
  ]);
  for (const section of propskitSections) {
    expect(section.group).toBe("Getting started");
    expect(section.examples.length).toBeGreaterThan(0);
    for (const example of section.examples) {
      expect(example.markup).toContain("figCreateProps");
      expect(example.markup).toContain("figCreatePropsRoot");
      expect(example.markup).toContain("panelIds: [kit.id]");
      expect(example.createConfig()).toBeTruthy();
    }
  }
  expect(propskitSections.find((section) => section.id === "groups")?.examples[0])
    .toMatchObject({
      title: "Nested groups",
      panelName: "Transform",
    });
  const numberExample = propskitSections.find(
    (section) => section.id === "numbers",
  )?.examples[0];
  expect(numberExample).toMatchObject({
    title: "Number variants",
    panelName: null,
  });
  expect(numberExample?.createConfig()).toMatchObject({
    sliders: {
      stepper: { control: "slider", stepper: true },
    },
    numbers: {
      withStepper: { control: "number" },
      withoutStepper: { control: "number", stepper: false },
    },
  });
  expect(numberExample?.createConfig()).not.toHaveProperty("sliders._label");
  expect(numberExample?.createConfig()).not.toHaveProperty("numbers._label");
  const colorSection = propskitSections.find(
    (section) => section.id === "colors",
  );
  expect(colorSection?.examples.map((example) => example.name)).toEqual([
    "Color",
    "Color (alpha)",
  ]);
  expect(colorSection?.examples.map((example) => example.createConfig())).toEqual([
    {
      color: {
        type: "color",
        default: "#0D99FF",
        alpha: false,
      },
    },
    {
      color: {
        type: "color",
        default: "#00000080",
        alpha: true,
      },
    },
  ]);
  const toggleSection = propskitSections.find(
    (section) => section.id === "toggles",
  );
  expect(toggleSection?.examples.map((example) => example.name)).toEqual([
    "On",
    "Off",
  ]);
  expect(toggleSection?.examples.map((example) => example.createConfig())).toEqual([
    { enabled: true },
    { enabled: false },
  ]);
  const textSection = propskitSections.find((section) => section.id === "text");
  expect(textSection?.examples.map((example) => example.name)).toEqual([
    "Single line (Text)",
    "Multiline",
  ]);
  expect(textSection?.examples.map((example) => example.createConfig())).toEqual([
    { text: "Hello" },
    {
      description: {
        type: "text",
        default: "Write a longer description here.",
        multiline: true,
        autoresize: true,
      },
    },
  ]);
  const mergedSections = sortSectionsWithinGroups([
    ...propskitSections,
    ...figui3Sections,
  ]);
  expect(mergedSections.slice(0, 7).map((section) => section.id)).toEqual([
    "quick-start",
    "numbers",
    "colors",
    "toggles",
    "text",
    "groups",
    "propskit-media",
  ]);
  expect(mergedSections[7].group).toBe("Inputs");
});

test("field-driven dialog examples use figCreateProps", () => {
  const convertedIds = [
    "dialog-rename",
    "dialog-shadow",
    "dialog-blur",
    "dialog-photo-stack",
    "dialog-export",
    "dialog-token-editor",
  ];

  for (const id of convertedIds) {
    const example = figui3Sections.find((section) => section.id === id)
      ?.examples[0];
    expect(example?.markup).toContain("figCreateProps");
    expect(example?.markup).toContain('<dialog\n  id="props-dialog"');
    expect(example?.markup).toContain(
      '<fig-content id="props-dialog-content"></fig-content>',
    );
    expect(example?.markup).toContain('<script type="module">');
    expect(example && "lang" in example && example.lang).toBe("html");
    expect(example && "createConfig" in example).toBe(true);
    expect(example && "dialog" in example).toBe(true);
  }

  const structuralExample = figui3Sections.find(
    (section) => section.id === "dialog-prepress",
  )?.examples[0];
  expect(structuralExample?.markup).toContain("<fig-tabs>");
  expect(structuralExample && "createConfig" in structuralExample).toBe(false);
});

test.describe.serial("ExampleView DOM synchronization", () => {
  let playgroundServer: ChildProcess;
  let serverOutput = "";

  test.beforeAll(async () => {
    const port = await getAvailablePort();
    playgroundUrl = `http://127.0.0.1:${port}`;
    playgroundServer = spawn(
      process.execPath,
      [
        path.resolve("playground/node_modules/vite/bin/vite.js"),
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--strictPort",
      ],
      {
        cwd: path.resolve("playground"),
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    playgroundServer.stdout?.on("data", (chunk) => {
      serverOutput += chunk.toString();
    });
    playgroundServer.stderr?.on("data", (chunk) => {
      serverOutput += chunk.toString();
    });
    await waitForServer(playgroundUrl, playgroundServer, () => serverOutput);
  });

  test.afterAll(async () => {
    if (!playgroundServer || playgroundServer.exitCode !== null) return;
    playgroundServer.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => playgroundServer.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 2_000)),
    ]);
    if (playgroundServer.exitCode === null) playgroundServer.kill("SIGKILL");
  });

  test("DOM capability analysis follows current element and parent layout", async ({
    page,
  }) => {
    await page.goto(playgroundUrl);
    const moduleUrl = `/@fs/${path.resolve(
      "src/modules/css-property-capabilities.js",
    )}`;
    const result = await page.evaluate(async (url) => {
      const {
        analyzeElementStyleCapabilities,
        createCssModuleConfig,
        getElementStyleCapability,
      } = await import(url);
      const parent = document.createElement("div");
      const child = document.createElement("span");
      parent.append(child);
      document.body.append(parent);

      parent.style.display = "block";
      const block = analyzeElementStyleCapabilities(parent);
      const blockFlex = block.properties.find(
        (entry: { property: string }) => entry.property === "flex-direction",
      );
      const inlineWidth = getElementStyleCapability(child, "width");

      parent.style.display = "flex";
      const flex = analyzeElementStyleCapabilities(parent);
      const flexDirection = flex.properties.find(
        (entry: { property: string }) => entry.property === "flex-direction",
      );
      const flexGrow = getElementStyleCapability(child, "flex-grow");
      const seeded = createCssModuleConfig("layout", { element: parent });

      parent.remove();
      return {
        blockFlex: blockFlex?.status,
        flexDirection: flexDirection?.status,
        inlineWidth: inlineWidth?.status,
        flexGrow: flexGrow?.status,
        seededMode: seeded.mode,
        seededDisplay: seeded.config.display?.default,
      };
    }, moduleUrl);

    expect(result).toEqual({
      blockFlex: "not-applicable",
      flexDirection: "applicable",
      inlineWidth: "not-applicable",
      flexGrow: "applicable",
      seededMode: "element",
      seededDisplay: "flex",
    });
  });

  test("module routes render PropsKit controls without runtime errors", async ({
    page,
  }) => {
    for (const module of moduleSections) {
      await page.goto(`${playgroundUrl}/#${module.id}/default`);
      await expect(page.locator(".example-header h2")).toContainText(
        module.name,
      );
      await expect(page.locator(".propkit-run-error")).toHaveCount(0);
      await expect(
        page.locator(`fig-group[name="Modules"] fig-layer[data-section="${module.id}"]`),
      ).toHaveCount(1);
      const visibilityIcons = page.locator(
        '.propkit-example-preview fig-icon[name="visible"], ' +
          '.propkit-example-preview fig-icon[name="hidden"]',
      );
      for (let index = 0; index < await visibilityIcons.count(); index += 1) {
        await expect(visibilityIcons.nth(index)).not.toHaveAttribute("size");
      }
    }
  });

  test("module element selection filters controls by computed capability", async ({
    page,
  }) => {
    await page.goto(`${playgroundUrl}/#module-layout/default`);
    const select = page.locator("[data-propskit-element] fig-select");
    await expect(select).toHaveAttribute("value", "__any__");

    await select.evaluate((element: HTMLElement & { value?: string }) => {
      element.value = "span";
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect
      .poll(async () =>
        page.locator("[data-propskit-values] .cm-content").textContent(),
      )
      .not.toContain('"width":');
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"display": "inline"');

    await select.evaluate((element: HTMLElement & { value?: string }) => {
      element.value = "img";
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect
      .poll(async () =>
        page.locator("[data-propskit-values] .cm-content").textContent(),
      )
      .toContain('"width":');
    await expect(page.locator(".propkit-run-error")).toHaveCount(0);
  });

  test("Layout uses its opinionated module layout", async ({ page }) => {
    await page.goto(`${playgroundUrl}/#module-layout/default`);
    const module = page.locator("[data-layout-module]");
    await expect(module).toBeVisible();
    await expect(module.locator("fig-group")).toHaveCount(1);
    await expect(module.locator("fig-group > fig-header")).toContainText(
      "Layout",
    );
    await expect(module.getByText("Add flex")).toHaveCount(0);

    const inputs = module.locator("fig-input-number");
    await expect(inputs).toHaveCount(4);
    await expect(inputs.first()).toHaveAttribute("steppers", "false");
    await expect(
      module.locator('fig-input-number[aria-label="X position"]'),
    ).toHaveCount(1);
    await expect(
      module.locator('fig-input-number[aria-label="Y position"]'),
    ).toHaveCount(1);
    await expect(
      module.locator('fig-input-number[aria-label="Rotation"]'),
    ).toHaveCount(0);
    await expect(
      module.locator('fig-input-number[aria-label="Width"]'),
    ).toHaveCount(1);
    await expect(
      module.locator('fig-input-number[aria-label="Height"]'),
    ).toHaveCount(1);
    const positionProperty = module.locator(
      'fig-property:has([data-layout-property="left"])',
    );
    await expect(positionProperty).toHaveAttribute("trailing", "space");
    await expect(positionProperty).toHaveAttribute("show-trailing", "");
    await expect(
      module.locator(
        'fig-property > fig-stack[slot="input"] > fig-tooltip > [data-layout-property]',
      ),
    ).toHaveCount(4);
    await expect(
      module.locator(
        'fig-property > fig-tooltip > fig-checkbox[slot="input"]',
      ),
    ).toHaveCount(1);
    const aspectRatioButton = module.locator(
      'fig-property:has([data-layout-property="width"]) > fig-button[slot="trailing"][aria-label="Constrain proportions"]',
    );
    await expect(aspectRatioButton).toHaveAttribute("slot", "trailing");
    await expect(aspectRatioButton).toHaveAttribute("variant", "ghost");
    await expect(aspectRatioButton).toHaveAttribute("type", "toggle");
    await expect(aspectRatioButton).toHaveAttribute("aria-pressed", "false");
    await expect(aspectRatioButton.locator("..")).toHaveAttribute(
      "show-trailing",
      "",
    );
    const aspectRatioIcon = aspectRatioButton.locator("span");
    await expect(aspectRatioIcon).toHaveCSS(
      "mask-image",
      /icon\.24\.crop\.aspect-ratio\.square/,
    );
    await expect(aspectRatioIcon).toHaveCSS("width", "24px");
    await expect(aspectRatioIcon).toHaveCSS("height", "24px");
    const sizeInputs = module.locator("fig-split-input");
    await expect(sizeInputs).toHaveCount(2);
    await expect(sizeInputs.first()).toHaveAttribute(
      "options",
      "Fixed,Fill,Relative",
    );
    await expect(sizeInputs.first().locator("fig-select")).toHaveAttribute(
      "value",
      "Relative",
    );

    const modes = module.locator(
      'fig-segmented-control[aria-labelledby^="fig-layout-module-title-"]',
    );
    await expect(
      module.locator("fig-group > fig-property").first().locator(
        'fig-segmented-control[aria-labelledby^="fig-layout-module-title-"]',
      ),
    ).toHaveCount(1);
    await expect(modes).not.toHaveAttribute("aria-label", "Layout mode");
    await expect(modes.locator("fig-segment")).toHaveCount(4);
    await expect(modes.locator("fig-segment").nth(1)).toHaveAttribute(
      "value",
      "horizontal",
    );
    await expect(modes.locator("fig-segment").nth(2)).toHaveAttribute(
      "value",
      "vertical",
    );
    await expect(modes.locator(":scope > fig-tooltip")).toHaveCount(4);
    await expect(
      modes.locator(
        ':scope > fig-tooltip[text="Freeform"] > fig-segment[value="freeform"]',
      ),
    ).toHaveCount(1);
    await expect(
      module.locator("fig-tooltip > fig-segmented-control"),
    ).toHaveCount(0);
    await expect(modes.locator("fig-segment fig-icon svg")).toHaveCount(4);
    await expect(modes).toHaveAttribute("value", "freeform");

    await modes.locator('fig-segment[value="vertical"]').click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"display": "flex"');
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"flex-direction": "column"');

    await modes.locator('fig-segment[value="horizontal"]').click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"flex-direction": "row"');

    await modes.locator('fig-segment[value="grid"]').click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"display": "grid"');

    await modes.locator('fig-segment[value="freeform"]').click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"display": "block"');

    await module.locator("fig-checkbox input").check();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"overflow": "hidden"');

    await module
      .locator('fig-input-number[aria-label="Width"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "320";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
    await module
      .locator('fig-input-number[aria-label="Height"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "180";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
    await aspectRatioButton.click();
    await expect(aspectRatioButton).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"aspect-ratio": "320 / 180"');

    await module
      .locator('fig-input-number[aria-label="Width"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "640";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"aspect-ratio": "640 / 180"');

    await module
      .locator('fig-input-number[aria-label="X position"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "24";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
    await expect(
      page.locator("[data-propskit-event] .cm-content"),
    ).toContainText('"path": "aspect-ratio"');
    await expect(
      page.locator("[data-propskit-event] .cm-content"),
    ).toContainText('"value": "640 / 180"');

    await aspectRatioButton.click();
    await expect(aspectRatioButton).toHaveAttribute("aria-pressed", "false");
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"aspect-ratio": "auto"');

    await module
      .locator('fig-input-number[aria-label="Width"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "420";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"width": "420%"');

    const moduleUrl = `/@fs/${path.resolve(
      "src/modules/fig-create-module.js",
    )}`;
    const synced = await page.evaluate(async (url) => {
      const { figCreateModule } = await import(url);
      const host = document.createElement("div");
      document.body.append(host);
      const controller = figCreateModule("layout");
      controller.mount(host);
      controller.setValues({
        left: "12px",
        top: "24px",
        width: "320px",
        height: "180px",
        "aspect-ratio": "16 / 9",
        display: "flex",
        "flex-direction": "column",
        overflow: "hidden",
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const result = {
        x: host
          .querySelector<HTMLElement>('[data-layout-property="left"]')
          ?.getAttribute("value"),
        mode: host
          .querySelector("fig-segmented-control")
          ?.getAttribute("value"),
        clipped: host
          .querySelector("fig-checkbox")
          ?.hasAttribute("checked"),
        constrained: host
          .querySelector<HTMLElement>(
            'fig-button[aria-label="Constrain proportions"]',
          )
          ?.hasAttribute("selected"),
      };
      controller.destroy();
      host.remove();
      return result;
    }, moduleUrl);
    expect(synced).toEqual({
      x: "12",
      mode: "vertical",
      clipped: true,
      constrained: true,
    });
    await expect(page.locator(".propkit-run-error")).toHaveCount(0);
  });

  test("Typography uses its dedicated module", async ({ page }) => {
    await page.goto(`${playgroundUrl}/#module-typography/default`);
    const module = page.locator("fig-module-typography");
    await expect(module).toBeVisible();
    await expect(module.locator("fig-group > fig-header")).toContainText(
      "Typography",
    );
    await expect(module.locator("fig-select")).toHaveCount(2);
    await expect(
      module.locator(
        'fig-property > fig-tooltip > fig-select[label="Font family"]',
      ),
    ).toHaveCount(0);
    await expect(module.locator("fig-font-picker")).toHaveCount(1);
    await expect(module.locator("fig-font-picker")).toHaveAttribute(
      "value",
      '{"family":"Inter","axes":{}}',
    );
    const weightOptions = module.locator(
      'fig-select[label="Font weight"] fig-select-option',
    );
    await expect(weightOptions).toHaveCount(9);
    await expect(module.locator("fig-input-number")).toHaveCount(3);
    const fontSizeInput = module.locator(
      'fig-input-number[data-typography-property="font-size"]',
    );
    await expect(
      fontSizeInput,
    ).toHaveAttribute("value", "16");
    await expect(fontSizeInput).not.toHaveAttribute("aria-label", "Font size");
    await expect(module.locator("fig-segmented-control")).toHaveCount(2);
    await expect(
      module.locator(
        'fig-segmented-control[aria-label="Text alignment"] fig-segment',
      ),
    ).toHaveCount(3);
    await expect(module.locator("fig-icon > svg")).toHaveCount(8);
    await expect(
      module.locator(
        'fig-select[label="Font weight"] > [slot="prepend-trigger"]',
      ),
    ).toHaveCount(0);
    await expect(
      module.locator(
        'fig-input-number[aria-label="Line height"] fig-icon[slot="prepend"] > svg',
      ),
    ).toHaveAttribute("viewBox", "0 0 24 24");
    await expect(module.locator("fig-tooltip")).toHaveCount(12);
    await expect(
      module.locator('fig-tooltip[text="Font family"] fig-font-picker'),
    ).toHaveCount(1);
    await expect(
      module.locator('fig-tooltip[text="Font size"] fig-input-number'),
    ).toHaveCount(1);
    await expect(
      module.locator('fig-tooltip[text="Align middle"] fig-segment'),
    ).toHaveCount(1);
    await expect(module.locator('fig-tooltip[slot="input"]')).toHaveCount(0);
    await expect(
      module.locator('fig-property [slot="input"]'),
    ).toHaveCount(4);
    const iconGeometry = await module
      .locator("fig-icon > svg")
      .evaluateAll((icons) =>
        icons.map((icon) => {
          const box = icon.getBoundingClientRect();
          return {
            width: box.width,
            height: box.height,
            fill: getComputedStyle(icon.querySelector("path")!).fill,
          };
        }),
      );
    expect(
      iconGeometry.every(
        ({ width, height, fill }) =>
          width === 24 && height === 24 && fill !== "none",
      ),
    ).toBe(true);

    await module
      .locator("fig-font-picker")
      .evaluate((element: HTMLElement & { open(): void }) => element.open());
    await module
      .locator('[data-font-option-id="family:Archivo Black"]')
      .click();
    await expect(weightOptions).toHaveCount(1);
    await expect(weightOptions.first()).toHaveAttribute("value", "400");

    await module
      .locator("fig-font-picker")
      .evaluate((element: HTMLElement & { open(): void }) => element.open());
    await module
      .locator('[data-font-option-id="family:serif"]')
      .click();
    await expect(weightOptions).toHaveCount(9);
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"font-family": "serif"');

    await module
      .locator('fig-input-number[data-typography-property="font-size"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "24";
        element.dispatchEvent(new Event("change", { bubbles: true }));
      });
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"font-size": "24px"');
    await expect(page.locator(".propkit-run-error")).toHaveCount(0);
  });

  test("Border, Stroke, and Outline use compact dedicated modules", async ({
    page,
  }) => {
    await page.goto(`${playgroundUrl}/#module-border/default`);
    const border = page.locator("fig-module-border");
    await expect(border).toBeVisible();
    const borderValues = page.locator("[data-propskit-values] .cm-content");
    await expect(borderValues).not.toContainText('"border":');
    await expect(borderValues).not.toContainText('"border-radius"');
    await expect(borderValues).not.toContainText('"border-image"');
    await expect(borderValues).not.toContainText('"border-block"');
    await expect(border.locator("fig-group > fig-header").first()).toContainText(
      "Border",
    );
    await expect(
      border.locator('fig-button[aria-label="Advanced settings"]'),
    ).toHaveCount(0);
    await expect(
      border.locator(".compact-line-module-advanced"),
    ).toHaveCount(0);
    await expect(
      border.locator(
        'fig-property > fig-stack[slot="input"] > :not(fig-tooltip)',
      ),
    ).toHaveCount(0);
    await expect(
      border.locator("fig-group > fig-property").first(),
    ).toHaveClass(/compact-line-module-color/);
    const borderColorRow = border.locator(".compact-line-module-color");
    await expect(borderColorRow).toHaveAttribute("show-trailing", "");
    await expect(
      borderColorRow.locator(':scope > fig-stack[slot="trailing"]'),
    ).toHaveCount(1);
    await expect(
      borderColorRow.locator(
        'fig-button[aria-label="Hide border"], fig-button[aria-label="Show border"]',
      ),
    ).toHaveCount(1);
    await expect(
      borderColorRow.locator('fig-button[aria-label="Remove border"]'),
    ).toHaveCount(1);
    const borderPrimaryRow = border.locator(".compact-line-module-primary");
    const addBorder = border.locator(
      'fig-button[aria-label="Add border"]',
    );
    await expect(addBorder).toBeVisible();
    await expect(borderColorRow).toBeHidden();
    await expect(borderPrimaryRow).toBeHidden();
    await addBorder.click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"border-style": "solid"');
    await expect(addBorder).toBeHidden();
    await expect(borderColorRow).toBeVisible();
    await expect(borderPrimaryRow).toBeVisible();
    await expect(
      border.locator(
        ".compact-line-module-primary > fig-stack > fig-tooltip > fig-button",
      ),
    ).toHaveCount(0);
    await expect(
      border.locator(
        'fig-input-number[aria-label="Border width"] > fig-icon[slot="prepend"] svg',
      ),
    ).toHaveCount(1);
    await expect(border.locator('fig-select[label="Border style"]')).toHaveCount(
      1,
    );
    await expect(border.locator('fig-select[label="Border sides"]')).toHaveCount(
      1,
    );
    await border
      .locator('fig-select[label="Border sides"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "top";
        element.dispatchEvent(
          new CustomEvent("change", {
            bubbles: true,
            composed: true,
            detail: "top",
          }),
        );
      });
    await expect(addBorder).toBeVisible();
    await expect(borderColorRow).toBeHidden();
    await expect(borderPrimaryRow).toBeHidden();
    await addBorder.click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"border-top-style": "solid"');
    await expect(addBorder).toBeHidden();
    await expect(borderColorRow).toBeVisible();
    await expect(borderPrimaryRow).toBeVisible();
    await border
      .locator('fig-input-number[aria-label="Border width"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "3";
        element.dispatchEvent(new Event("change", { bubbles: true }));
      });
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"border-top-width": "3px"');
    await border.locator('fig-button[aria-label="Remove border"]').click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"border-top-style": "none"');
    await expect(addBorder).toBeVisible();
    await expect(borderColorRow).toBeHidden();
    await expect(borderPrimaryRow).toBeHidden();
    await addBorder.click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"border-top-style": "solid"');
    await expect(addBorder).toBeHidden();
    await expect(borderColorRow).toBeVisible();
    await expect(borderPrimaryRow).toBeVisible();

    await page.goto(`${playgroundUrl}/#module-stroke/default`);
    const stroke = page.locator("fig-module-stroke");
    await expect(stroke).toBeVisible();
    const strokeValues = page.locator("[data-propskit-values] .cm-content");
    await expect(strokeValues).not.toContainText('"marker');
    await expect(strokeValues).not.toContainText('"paint-order"');
    await expect(strokeValues).not.toContainText('"vector-effect"');
    await expect(strokeValues).not.toContainText('"stroke-miterlimit"');
    await expect(
      stroke.locator(
        'fig-property > fig-stack[slot="input"] > :not(fig-tooltip)',
      ),
    ).toHaveCount(0);
    await expect(
      stroke.locator(
        'fig-input-number[aria-label="Stroke width"] > fig-icon[slot="prepend"] svg',
      ),
    ).toHaveCount(1);
    await expect(
      stroke.locator("fig-group > fig-property").first(),
    ).toHaveClass(/compact-line-module-color/);
    const strokeColorRow = stroke.locator(".compact-line-module-color");
    await expect(strokeColorRow).toHaveAttribute("show-trailing", "");
    await expect(
      strokeColorRow.locator(':scope > fig-stack[slot="trailing"]'),
    ).toHaveCount(1);
    await expect(
      stroke.locator(
        '.compact-line-module-color fig-button[aria-label="Hide stroke"]',
      ),
    ).toHaveCount(1);
    await expect(
      stroke.locator(
        '.compact-line-module-color fig-button[aria-label="Remove stroke"]',
      ),
    ).toHaveCount(1);
    await expect(
      stroke.locator(
        ".compact-line-module-primary > fig-stack > fig-tooltip > fig-button",
      ),
    ).toHaveCount(0);
    await expect(
      stroke.locator('fig-button[aria-label="Advanced settings"]'),
    ).toHaveCount(0);
    await expect(
      stroke.locator(".compact-line-module-advanced"),
    ).toHaveCount(0);
    await expect(
      stroke.locator(
        '.compact-line-module-color > fig-stack > fig-input-number[aria-label="Stroke opacity"]',
      ),
    ).toHaveCount(0);
    const strokeColorOpacity = stroke.locator(
      ".compact-line-module-color fig-input-color fig-input-number",
    );
    await expect(strokeColorOpacity).toHaveCount(1);
    await strokeColorOpacity.evaluate(
      (element: HTMLElement & { value?: string }) => {
        element.value = "50";
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      },
    );
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"stroke-opacity": 0.5');
    await expect(stroke.locator('fig-select[label="Stroke style"]')).toHaveCount(
      1,
    );
    const strokeDashRow = stroke.locator(".compact-line-module-dash");
    await expect(strokeDashRow).toBeHidden();
    await expect(
      stroke.locator(
        ".compact-line-module-dash + .compact-line-module-line",
      ),
    ).toHaveCount(1);
    await stroke
      .locator('fig-select[label="Stroke style"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "dashed";
        element.dispatchEvent(
          new CustomEvent("change", {
            bubbles: true,
            composed: true,
            detail: "dashed",
          }),
        );
      });
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"stroke-dasharray": "6 3"');
    await expect(strokeDashRow).toBeVisible();
    await stroke
      .locator('fig-input-number[aria-label="Stroke dash offset"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "-2";
        element.dispatchEvent(new Event("change", { bubbles: true }));
      });
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"stroke-dashoffset": "-2"');
    await stroke.locator('fig-button[aria-label="Remove stroke"]').click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"stroke": "none"');
    await stroke.locator('fig-button[aria-label="Add stroke"]').click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"stroke-width": "1px"');

    await page.goto(`${playgroundUrl}/#module-outline/default`);
    const outline = page.locator("fig-module-outline");
    await expect(outline).toBeVisible();
    await expect(
      outline.locator(
        'fig-property > fig-stack[slot="input"] > :not(fig-tooltip)',
      ),
    ).toHaveCount(0);
    await expect(
      outline.locator(
        'fig-input-number[aria-label="Outline width"] > fig-icon[slot="prepend"] svg',
      ),
    ).toHaveCount(1);
    await expect(
      outline.locator('fig-button[aria-label="Advanced settings"]'),
    ).toHaveCount(0);
    await expect(
      outline.locator(".compact-line-module-advanced"),
    ).toHaveCount(0);
    const addOutline = outline.locator(
      'fig-button[aria-label="Add outline"]',
    );
    const outlineColorRow = outline.locator(".compact-line-module-color");
    const outlinePrimaryRow = outline.locator(
      'fig-property:has(fig-input-number[aria-label="Outline width"])',
    );
    await expect(outlinePrimaryRow).not.toHaveClass(
      /compact-line-module-primary/,
    );
    await expect(
      outlinePrimaryRow.locator(':scope > fig-stack[slot="input"]'),
    ).toHaveCount(1);
    const outlineValues = page.locator("[data-propskit-values] .cm-content");
    await expect(outlineValues).toContainText('"outline": "none"');
    await expect(outlineValues).not.toContainText('"outline-style"');
    await expect(addOutline).toBeVisible();
    await expect(outlineColorRow).toBeHidden();
    await expect(outlinePrimaryRow).toBeHidden();
    await addOutline.click();
    await expect(outlineValues).toContainText('"outline-style": "solid"');
    await expect(outlineValues).not.toContainText('"outline":');
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"outline-color": "#005fcc"');
    await expect(
      outline.locator('fig-input-color[aria-label="Outline color"]'),
    ).toHaveAttribute("value", "#005fcc");
    await expect(addOutline).toBeHidden();
    await expect(outlineColorRow).toBeVisible();
    await expect(outlinePrimaryRow).toBeVisible();
    await expect(
      outline.locator('fig-select[label="Outline style"]'),
    ).toHaveCount(1);
    await expect(
      outline.locator(
        'fig-select[label="Outline style"] fig-select-option[value="none"]',
      ),
    ).toHaveCount(0);
    const outlineAlignment = outline.locator(
      'fig-select[label="Outline alignment"]',
    );
    await expect(outlineAlignment).toBeVisible();
    await expect(outlineAlignment).toHaveAttribute("value", "outside");
    await outlineAlignment.evaluate(
      (element: HTMLElement & { value?: string }) => {
        element.value = "inside";
        element.dispatchEvent(
          new CustomEvent("change", {
            bubbles: true,
            composed: true,
            detail: "inside",
          }),
        );
      },
    );
    await outline
      .locator('fig-input-number[aria-label="Outline width"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "4";
        element.dispatchEvent(new Event("change", { bubbles: true }));
      });
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"outline-offset": "-4px"');
    await outlineAlignment.evaluate(
      (element: HTMLElement & { value?: string }) => {
        element.value = "center";
        element.dispatchEvent(
          new CustomEvent("change", {
            bubbles: true,
            composed: true,
            detail: "center",
          }),
        );
      },
    );
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"outline-offset": "-2px"');
    await outlineAlignment.evaluate(
      (element: HTMLElement & { value?: string }) => {
        element.value = "custom";
        element.dispatchEvent(
          new CustomEvent("change", {
            bubbles: true,
            composed: true,
            detail: "custom",
          }),
        );
      },
    );
    const customOutlineOffset = outline.locator(
      'fig-split-input[aria-label="Outline offset"]',
    );
    await expect(outlineAlignment).toBeHidden();
    await expect(customOutlineOffset).toBeVisible();
    await outline
      .locator('fig-input-number[aria-label="Outline offset"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "-7";
        element.dispatchEvent(new Event("change", { bubbles: true }));
      });
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"outline-offset": "-7px"');
    await expect(
      customOutlineOffset.locator("fig-select"),
    ).toHaveAttribute("value", "Custom");
    await outline
      .locator('fig-select[label="Outline style"]')
      .evaluate((element: HTMLElement & { value?: string }) => {
        element.value = "dashed";
        element.dispatchEvent(
          new CustomEvent("change", {
            bubbles: true,
            composed: true,
            detail: "dashed",
          }),
        );
      });
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"outline-style": "dashed"');
    await outline.locator('fig-button[aria-label="Hide outline"]').click();
    await expect(outlineValues).toContainText('"outline": "none"');
    await expect(outlineValues).not.toContainText('"outline-color"');
    await expect(outlineValues).not.toContainText('"outline-style"');
    await expect(outlineValues).not.toContainText('"outline-width"');
    await expect(outlineValues).not.toContainText('"outline-offset"');
    await expect(
      page.locator("[data-propskit-event] .cm-content"),
    ).toContainText('"path": "outline"');
    await expect(
      page.locator("[data-propskit-event] .cm-content"),
    ).toContainText('"value": "none"');
    await outline.locator('fig-button[aria-label="Show outline"]').click();
    await expect(outlineValues).toContainText('"outline-style": "dashed"');
    await expect(outlineValues).not.toContainText('"outline":');
    await expect(addOutline).toBeHidden();
    await outline.locator('fig-button[aria-label="Remove outline"]').click();
    await expect(outlineValues).toContainText('"outline": "none"');
    await expect(outlineValues).not.toContainText('"outline-style"');
    await expect(addOutline).toBeVisible();
    await expect(outlineColorRow).toBeHidden();
    await expect(outlinePrimaryRow).toBeHidden();
    await addOutline.click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"outline-style": "dashed"');
    await expect(addOutline).toBeHidden();
    await expect(outlineColorRow).toBeVisible();
    await expect(outlinePrimaryRow).toBeVisible();
    const moduleUrl = `/@fs/${path.resolve(
      "src/modules/fig-create-module.js",
    )}`;
    const synchronized = await page.evaluate(async (url) => {
      const { figCreateModule } = await import(url);
      const host = document.createElement("div");
      document.body.append(host);

      const borderController = figCreateModule("border");
      borderController.mount(host);
      borderController.setValue("border-width", "7px");
      const borderWidth = host
        .querySelector('fig-input-number[aria-label="Border width"]')
        ?.getAttribute("value");
      borderController.destroy();

      const strokeController = figCreateModule("stroke");
      strokeController.mount(host);
      strokeController.setValue("stroke-dashoffset", "-3");
      const strokeOffset = host
        .querySelector('fig-input-number[aria-label="Stroke dash offset"]')
        ?.getAttribute("value");
      strokeController.destroy();

      const outlineController = figCreateModule("outline");
      outlineController.mount(host);
      outlineController.setValue("outline-offset", "5px");
      const outlineOffset = host
        .querySelector('fig-input-number[aria-label="Outline offset"]')
        ?.getAttribute("value");
      outlineController.destroy();
      host.remove();

      return { borderWidth, strokeOffset, outlineOffset };
    }, moduleUrl);
    expect(synchronized).toEqual({
      borderWidth: "7",
      strokeOffset: "-3",
      outlineOffset: "5",
    });
    await expect(page.locator(".propkit-run-error")).toHaveCount(0);
  });

  test("Appearance uses its opinionated module layout", async ({ page }) => {
    await page.goto(`${playgroundUrl}/#module-appearance/default`);
    const module = page.locator("fig-module-appearance");
    await expect(module).toBeVisible();
    await expect(module.locator("fig-group")).toHaveCount(1);
    await expect(module.locator("fig-group > fig-header")).toContainText(
      "Appearance",
    );
    await expect(
      module.locator("fig-group > fig-header fig-button[aria-label]"),
    ).toHaveCount(1);
    const visibilityButton = module.locator(
      'fig-group > fig-header fig-button[type="toggle"]',
    );
    await expect(visibilityButton).not.toHaveAttribute("selected", "");
    await visibilityButton.click();
    await expect(visibilityButton).toHaveAttribute("selected", "");
    await expect(visibilityButton).toHaveAttribute("aria-pressed", "true");
    await expect(visibilityButton.locator('fig-icon[name="hidden"]')).toHaveCount(
      1,
    );
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"visibility": "hidden"');
    await expect(module.locator("fig-input-number")).toHaveAttribute(
      "aria-label",
      "Opacity",
    );
    await expect(module.locator("fig-select")).toHaveAttribute(
      "label",
      "Blend mode",
    );
    await expect(
      module.locator(
        'fig-property > fig-stack[slot="input"] > fig-tooltip',
      ),
    ).toHaveCount(2);
    await expect(
      page.locator("fig-select-options fig-separator"),
    ).toHaveCount(5);
    await expect(
      page.locator('fig-select-option[value="plus-lighter"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('fig-select-option[value="plus-darker"]'),
    ).toHaveCount(0);
    await expect(page.locator("main .propkit-code-view")).toHaveCount(1);
    await expect(page.locator("main .propkit-code-view")).toContainText(
      "figCreateModule",
    );
    await module.locator("fig-input-number").evaluate(
      (element: HTMLElement & { value?: string }) => {
        element.value = "50";
        element.dispatchEvent(new Event("input", { bubbles: true }));
      },
    );
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"opacity": 0.5');
    await module.locator("fig-select").evaluate((element) => {
      element.dispatchEvent(
        new CustomEvent("optionhover", {
          detail: "multiply",
          bubbles: true,
          composed: true,
        }),
      );
    });
    await expect(
      page.locator("[data-propskit-event] .cm-content"),
    ).toContainText('"phase": "option-hover"');
    await expect(
      page.locator("[data-propskit-event] .cm-content"),
    ).toContainText('"value": "multiply"');
    await expect(page.locator("[data-propskit-element]")).toBeVisible();
  });

  test("Background uses reorderable fill rows", async ({ page }) => {
    await page.goto(`${playgroundUrl}/#module-background/default`);
    const module = page.locator("[data-fills-module]");
    const rows = module.locator("fig-reorder > fig-property");

    await expect(module.locator("fig-header")).toContainText("Fills");
    await expect(
      module.locator('fig-header fig-button[aria-label="Add fill"]'),
    ).toHaveCount(1);
    await expect(rows).toHaveCount(1);
    await expect(
      rows.locator('fig-button[aria-label="Hide fill"]'),
    ).toHaveCount(1);
    await expect(
      rows.locator('fig-button[aria-label="Remove fill"]'),
    ).toHaveCount(1);
    await expect(rows.locator('[slot="leading"]')).toHaveCount(0);

    await module
      .locator('fig-header fig-button[aria-label="Add fill"]')
      .click();
    await page.locator('fig-menu-item[value="gradient"]').click();

    await expect(rows).toHaveCount(2);
    await expect(rows.locator('[slot="leading"]')).toHaveCount(2);
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"background-image": "linear-gradient(');

    await module.locator("fig-reorder").evaluate((reorder) => {
      reorder.append(reorder.firstElementChild!);
      reorder.dispatchEvent(
        new CustomEvent("reorder", {
          bubbles: true,
          detail: { oldIndex: 0, newIndex: 1 },
        }),
      );
    });
    await expect(rows.first().locator("fig-input-fill")).toHaveAttribute(
      "value",
      /"type":"gradient"/,
    );

    await rows
      .first()
      .locator('fig-button[aria-label="Hide fill"]')
      .click();
    await expect(
      rows.first().locator('fig-button[aria-label="Show fill"]'),
    ).toHaveCount(1);

    await rows
      .last()
      .locator('fig-button[aria-label="Remove fill"]')
      .click();
    await expect(rows).toHaveCount(1);
    await expect(rows.locator('[slot="leading"]')).toHaveCount(0);
  });

  test("Filters uses SVG-derived property rows", async ({ page }) => {
    await page.goto(`${playgroundUrl}/#module-filters/default`);
    const module = page.locator("[data-filters-module]");
    const rows = module.locator("fig-reorder > fig-property");

    await expect(
      module.locator("fig-module-filters > fig-group > fig-header"),
    ).toContainText("Filters");
    await expect(rows).toHaveCount(1);
    const controls = rows.locator('fig-stack[slot="input"]');
    await expect(controls.locator("fig-select")).toHaveAttribute(
      "value",
      "layer:gaussian-blur",
    );
    await expect(controls.locator("fig-input-number")).toHaveAttribute(
      "units",
      "px",
    );
    await expect(
      rows.locator('fig-button[aria-label="Hide filter"]'),
    ).toHaveCount(1);
    await expect(
      rows.locator('fig-button[aria-label="Remove filter"]'),
    ).toHaveCount(1);

    await module
      .locator('fig-header fig-button[aria-label="Add filter"]')
      .click();
    await page.locator('fig-menu-item[value="layer:hue-rotate"]').click();

    await expect(rows).toHaveCount(2);
    await expect(rows.locator('[slot="leading"]')).toHaveCount(2);
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"filter": "blur(4px) hue-rotate(0deg)"');

    await rows
      .first()
      .locator('fig-button[aria-label="Hide filter"]')
      .click();
    await expect(
      page.locator("[data-propskit-values] .cm-content"),
    ).toContainText('"filter": "hue-rotate(0deg)"');
  });

  test("Transforms uses editable ordered transform rows", async ({ page }) => {
    await page.goto(`${playgroundUrl}/#module-transforms/default`);
    const module = page.locator("[data-transforms-module]");
    const rows = module.locator("fig-reorder > fig-property");

    await expect(
      module.locator("fig-module-transforms > fig-group > fig-header"),
    ).toContainText("Transforms");
    await expect(rows).toHaveCount(1);
    await expect(
      rows.locator('fig-button[variant="property"]'),
    ).toContainText("Translate");
    await expect(
      rows.locator('fig-button[aria-label="Hide transform"]'),
    ).toHaveCount(1);
    await expect(
      rows.locator('fig-button[aria-label="Remove transform"]'),
    ).toHaveCount(1);

    await rows.locator('fig-button[variant="property"]').click();
    await expect(
      module.locator('dialog[open] fig-input-number'),
    ).toHaveCount(3);
  });

  test("compact button icon control uses a small chevron across type changes", async ({
    page,
  }) => {
    await page.goto(`${playgroundUrl}/propskit`);
    const state = await page.evaluate(async () => {
      const {
        applyButtonIconMutation,
        applyButtonTypeMutation,
      } = await import("/src/lib/attributeParser.ts");
      let markup = `<div class="prop-panel">
        <fig-field>
          <label>Action</label>
          <fig-button><span>Apply Changes</span></fig-button>
        </fig-field>
      </div>`;
      markup = applyButtonIconMutation(markup, 0, "compact");
      markup = applyButtonTypeMutation(markup, 0, "toggle");

      const template = document.createElement("template");
      template.innerHTML = markup;
      const button = template.content.querySelector("fig-button")!;
      return {
        iconMode: button.getAttribute("icon"),
        label: button.getAttribute("aria-label"),
        text: button.textContent?.trim() ?? "",
        children: Array.from(button.children).map((child) =>
          child.tagName.toLowerCase(),
        ),
        iconName: button.querySelector("fig-icon")?.getAttribute("name"),
        iconSize: button.querySelector("fig-icon")?.getAttribute("size"),
      };
    });

    expect(state).toEqual({
      iconMode: "compact",
      label: "Apply Changes",
      text: "",
      children: ["fig-icon"],
      iconName: "chevron",
      iconSize: "small",
    });
  });

  test("button combo variant mutation updates every nested button", async ({
    page,
  }) => {
    await page.goto(`${playgroundUrl}/propskit`);
    const state = await page.evaluate(async () => {
      const {
        applyButtonComboVariantMutation,
        parseAttributeTargets,
      } = await import("/src/lib/attributeParser.ts");
      const markup = `<div class="prop-panel">
        <fig-button-combo>
          <fig-button>Save</fig-button>
          <fig-button>Cancel</fig-button>
        </fig-button-combo>
      </div>`;
      const updated = applyButtonComboVariantMutation(
        markup,
        0,
        "secondary",
      );
      const template = document.createElement("template");
      template.innerHTML = updated;
      return {
        parsedVariant:
          parseAttributeTargets(updated)[0]?.controlAttributes.variant,
        variants: Array.from(
          template.content.querySelectorAll("fig-button"),
          (button) => button.getAttribute("variant"),
        ),
      };
    });

    expect(state).toEqual({
      parsedVariant: "secondary",
      variants: ["secondary", "secondary"],
    });
  });

  test("group header select mutation uses the regular variant", async ({
    page,
  }) => {
    await page.goto(`${playgroundUrl}/propskit`);
    const state = await page.evaluate(async () => {
      const { applyGroupHeaderControlMutation } = await import(
        "/src/lib/attributeParser.ts"
      );
      const markup = `<fig-group>
        <fig-header>
          <h3>Fill</h3>
          <fig-button variant="ghost">Add</fig-button>
        </fig-header>
      </fig-group>`;
      const updated = applyGroupHeaderControlMutation(markup, 0, "select");
      const template = document.createElement("template");
      template.innerHTML = updated;
      const select = template.content.querySelector("fig-select");
      return {
        variant: select?.getAttribute("variant"),
        value: select?.getAttribute("value"),
      };
    });

    expect(state).toEqual({
      variant: null,
      value: "Solid",
    });
  });

  test("property Combo input creates resettable X and Y number inputs", async ({
    page,
  }) => {
    await page.goto(`${playgroundUrl}/propskit`);
    const state = await page.evaluate(async () => {
      const {
        applyPropertyControlMutation,
        getPropertyControlTag,
      } = await import("/src/lib/attributeParser.ts");
      const markup = `<fig-property label="Position">
        <fig-input-number slot="input" value="16"></fig-input-number>
      </fig-property>`;
      const updated = applyPropertyControlMutation(
        markup,
        0,
        "fig-input-combo",
      );
      const template = document.createElement("template");
      template.innerHTML = updated;
      const combo = template.content.querySelector("fig-input-combo");
      return {
        controlTag: getPropertyControlTag(updated, 0),
        full: combo?.hasAttribute("full"),
        slot: combo?.getAttribute("slot"),
        inputs: Array.from(
          combo?.querySelectorAll(":scope > fig-input-number") ?? [],
          (input) => ({
            axis: input.querySelector('fig-icon[slot="prepend"]')?.textContent,
            defaultValue: input.getAttribute("default"),
            label: input.getAttribute("aria-label"),
            steppers: input.getAttribute("steppers"),
            value: input.getAttribute("value"),
          }),
        ),
      };
    });

    expect(state).toEqual({
      controlTag: "fig-input-combo",
      full: true,
      slot: "input",
      inputs: [
        {
          axis: "X",
          defaultValue: "0",
          label: "X",
          steppers: "false",
          value: "24",
        },
        {
          axis: "Y",
          defaultValue: "0",
          label: "Y",
          steppers: "false",
          value: "16",
        },
      ],
    });

    await page.goto(`${playgroundUrl}/figui3#property/default`);
    const control = page.getByRole("combobox", { name: "Control" });
    await expect(
      control.locator('option[value="fig-input-combo"]'),
    ).toHaveText("Combo input");
    await control.selectOption("fig-input-combo");

    const combo = page.locator(
      '.propkit-example fig-property > fig-input-combo[slot="input"]',
    );
    await expect(combo).toHaveAttribute("full", "");
    await expect(
      combo.locator(':scope > fig-input-number[aria-label="X"]'),
    ).toHaveAttribute("default", "0");
    await expect(
      combo.locator(':scope > fig-input-number[aria-label="Y"]'),
    ).toHaveAttribute("default", "0");
    await expect(
      combo.locator(':scope > fig-input-number[steppers="false"]'),
    ).toHaveCount(2);
  });

  test("swatch fill control creates a stepped palette gradient", async ({
    page,
  }) => {
    await page.goto(`${playgroundUrl}/propskit#swatch/default`);
    const fillControl = page.locator(
      'fig-options[options="Solid,Gradient,Palette,Image"]',
    );
    await expect(fillControl).toBeVisible();
    const swatchPanel = page
      .locator(".propkit-attributes-view")
      .filter({ has: fillControl });
    const alphaField = swatchPanel
      .locator("fig-property")
      .filter({ hasText: "Alpha" });
    await expect(alphaField).toHaveCount(0);

    await fillControl.locator("select").selectOption("Solid");
    await expect(alphaField).toHaveCount(1);
    expect(
      await swatchPanel.locator("fig-property > label").allTextContents(),
    ).toEqual(expect.arrayContaining(["Fill", "Alpha"]));
    const labels = await swatchPanel
      .locator("fig-property > label")
      .allTextContents();
    expect(labels.indexOf("Alpha")).toBe(labels.indexOf("Fill") + 1);

    await fillControl.locator("select").selectOption("Palette");
    await expect(alphaField).toHaveCount(0);

    await expect(page.locator(".propkit-example fig-swatch")).toHaveAttribute(
      "background",
      "linear-gradient(to right, #0D99FF 0%, #0D99FF 20%, #14AE5C 20%, #14AE5C 40%, #FFCD29 40%, #FFCD29 60%, #FF7262 60%, #FF7262 80%, #9747FF 80%, #9747FF 100%)",
    );
    await expect(fillControl).toHaveAttribute("value", "Palette");

    await fillControl.locator("select").selectOption("Image");
    await expect(page.locator(".propkit-example fig-swatch")).toHaveAttribute(
      "background",
      /^url\("https:\/\/images\.unsplash\.com\/photo-/,
    );
  });

  test("PropsKit source is editable and rebuilds the preview", async ({
    page,
  }) => {
    await page.goto(`${playgroundUrl}/propskit#numbers/variants`);
    const editor = page.locator(".propkit-code-view .cm-content");
    await expect(editor).toHaveAttribute("contenteditable", "true");
    await expect(
      page.getByRole("button", { name: "Run", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Copy JavaScript", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy prompt", exact: true }),
    ).toHaveCount(0);
    await editor.fill(`const kit = figCreateProps("Edited", { updated: 42 })
figCreatePropsRoot({ target: "#properties", panelIds: [kit.id] })`);

    await expect(
      page.locator('.propskit-example-preview fig-property[label="Updated"]'),
    ).toBeVisible();
    await expect(page.locator(".propkit-run-error")).toHaveCount(0);
  });

  for (const scenario of [
    { name: "slider", tag: "fig-input-slider" },
    { name: "joystick", tag: "fig-joystick" },
  ]) {
    test(`focused ${scenario.name} value and local state survive a patchable markup refresh`, async ({
      page,
    }) => {
      await mountExampleView(
        page,
        `<section data-revision="one"><${scenario.tag} tabindex="0" value="12"></${scenario.tag}></section>`,
      );
      const control = page.locator(
        `[data-example-harness="true"] ${scenario.tag}`,
      );
      await control.evaluate((element) => {
        (element as any).__localState = { retained: true };
        element.setAttribute("value", "73");
        element.dispatchEvent(new Event("input", { bubbles: true }));
        (element as HTMLElement).focus();
        (document.activeElement as any).__focusRetained = true;
      });

      await page.evaluate(
        ({ tag }) => {
          (window as any).__exampleViewHarness.render(
            `<section data-revision="two"><${tag} tabindex="0" value="24"></${tag}></section>`,
          );
        },
        { tag: scenario.tag },
      );

      await expect(control).toHaveAttribute("value", "73");
      expect(
        await control.evaluate(
          (element) =>
            (document.activeElement as any)?.__focusRetained === true &&
            (element as any).__localState?.retained === true,
        ),
      ).toBe(true);
    });
  }

  test("incompatible structure replacement restores the cached live value", async ({
    page,
  }) => {
    await mountExampleView(
      page,
      '<div><fig-input-slider value="10"></fig-input-slider></div>',
    );
    const control = page.locator(
      '[data-example-harness="true"] fig-input-slider',
    );
    await control.evaluate((element) => {
      (element as any).__oldInstance = true;
      element.setAttribute("value", "64");
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await page.evaluate(() => {
      (window as any).__exampleViewHarness.render(
        '<section><div><fig-input-slider value="20"></fig-input-slider></div></section>',
      );
    });

    await expect(control).toHaveAttribute("value", "64");
    expect(
      await control.evaluate((element) => (element as any).__oldInstance),
    ).toBeUndefined();
  });

  test("dialog open state remains synchronized with persisted markup", async ({
    page,
  }) => {
    await mountExampleView(
      page,
      '<div><dialog is="fig-dialog">Dialog content</dialog></div>',
    );
    const dialog = page.locator(
      '[data-example-harness="true"] dialog[is="fig-dialog"]',
    );
    await page.evaluate(() => {
      (window as any).__exampleViewHarness.setDialogSync(true);
    });

    await dialog.evaluate((element: HTMLDialogElement) => element.show());
    await expect(dialog).toHaveAttribute("open", "");
    await expect
      .poll(() =>
        page.evaluate(() => ({
          markup: (window as any).__exampleViewHarness.getMarkup(),
          states: (window as any).__exampleViewHarness.dialogStates,
        })),
      )
      .toMatchObject({
        markup: expect.stringContaining("open"),
        states: expect.arrayContaining([true]),
      });

    await dialog.evaluate((element: HTMLDialogElement) => element.close());
    await expect(dialog).not.toHaveAttribute("open");
    await expect
      .poll(() =>
        page.evaluate(() => ({
          markup: (window as any).__exampleViewHarness.getMarkup(),
          states: (window as any).__exampleViewHarness.dialogStates,
        })),
      )
      .toMatchObject({
        markup: expect.not.stringContaining(" open"),
        states: expect.arrayContaining([true, false]),
      });
  });

  test("replaced dialogs cannot publish queued stale state", async ({
    page,
  }) => {
    await mountExampleView(
      page,
      '<div><dialog is="fig-dialog">Old dialog</dialog></div>',
    );

    const states = await page.evaluate(async () => {
      const oldDialog = document.querySelector<HTMLDialogElement>(
        '[data-example-harness="true"] dialog[is="fig-dialog"]',
      );
      if (!oldDialog) throw new Error("Missing old dialog");

      oldDialog.setAttribute("open", "");
      (window as any).__exampleViewHarness.render(
        '<section><dialog is="fig-dialog">New dialog</dialog></section>',
      );
      await new Promise<void>((resolve) => queueMicrotask(resolve));
      await new Promise<void>((resolve) => queueMicrotask(resolve));
      return (window as any).__exampleViewHarness.dialogStates;
    });

    expect(states).toEqual([]);
    await expect(
      page.locator(
        '[data-example-harness="true"] dialog[is="fig-dialog"]',
      ),
    ).toContainText("New dialog");
  });
});
