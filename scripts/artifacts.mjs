export const NOTICE = [
  "PolyForm Shield License 1.0.0",
  "https://polyformproject.org/licenses/shield/1.0.0",
  "Required Notice: Copyright (c) 2026 Rogie King",
  "Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)",
];

export const jsArtifacts = [
  { input: "fig-editor.js", output: "fig-editor.js" },
  { input: "fig-lab.js", output: "fig-lab.js" },
  { input: "css-properties.js", output: "css-properties.js" },
  {
    input: "src/editor/entrypoints/fig-input-rotate.js",
    output: "fig-input-rotate.js",
  },
  {
    input: "src/lab/entrypoints/fig-input-slider.js",
    output: "fig-input-slider.js",
  },
];

export const cssArtifacts = [
  {
    input: "src/editor/index.css",
    output: "fig-editor.css",
    imports: ["@rogieking/figui3/fig-layer.css"],
  },
  { input: "fig-lab.css", output: "fig-lab.css" },
  {
    input: "src/editor/entrypoints/fig-input-rotate.css",
    output: "fig-input-rotate.css",
  },
  {
    input: "src/lab/entrypoints/fig-input-slider.css",
    output: "fig-input-slider.css",
  },
];

export const outputs = [
  ...jsArtifacts.map(({ output }) => output),
  ...cssArtifacts.map(({ output }) => output),
];

export const rootAssetNames = [
  "css-properties.js",
  "fig-editor.js",
  "fig-editor.css",
  "fig-lab.js",
  "fig-lab.css",
];

export const publicAliases = {
  "fig-input-rotate.js": "src/editor/entrypoints/fig-input-rotate.js",
  "fig-input-rotate.css": "src/editor/entrypoints/fig-input-rotate.css",
  "fig-input-slider.js": "src/lab/entrypoints/fig-input-slider.js",
  "fig-input-slider.css": "src/lab/entrypoints/fig-input-slider.css",
};
