/*
PolyForm Shield License 1.0.0
https://polyformproject.org/licenses/shield/1.0.0
Required Notice: Copyright (c) 2026 Rogie King
Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)
*/
import { PROPSKIT_CONTROL_TYPES } from "@rogieking/figui3/propskit.js";

const text = (property, label, fallback = "", applies = "all") => ({
  property,
  label,
  applies,
  definition: { type: "text", default: fallback },
  parser: "text",
});

const color = (property, label, fallback = "#000000", applies = "all") => ({
  property,
  label,
  applies,
  definition: { type: "color", default: fallback, alpha: true },
  parser: "color",
});

const number = (
  property,
  label,
  fallback = 0,
  units = "px",
  applies = "all",
  options = {},
) => ({
  property,
  label,
  applies,
  definition: {
    type: "number",
    control: "number",
    default: fallback,
    units,
    ...options,
  },
  parser: "number",
});

const select = (
  property,
  label,
  values,
  fallback = values[0],
  applies = "all",
) => ({
  property,
  label,
  applies,
  definition: { type: "options", default: fallback, options: values },
  parser: "options",
});

const DISPLAY_VALUES = [
  "block",
  "inline",
  "inline-block",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "flow-root",
  "contents",
  "none",
];
const BOX_VALUES = ["border-box", "content-box"];
const OVERFLOW_VALUES = ["visible", "hidden", "clip", "scroll", "auto"];
const POSITION_VALUES = ["static", "relative", "absolute", "fixed", "sticky"];
const ALIGN_VALUES = [
  "auto",
  "normal",
  "stretch",
  "start",
  "center",
  "end",
  "flex-start",
  "flex-end",
  "baseline",
];

const layout = [
  select("display", "Display", DISPLAY_VALUES, "block"),
  select("box-sizing", "Box sizing", BOX_VALUES, "border-box"),
  select("position", "Position", POSITION_VALUES, "static"),
  text("inset", "Inset", "auto", "positioned"),
  text("inset-block", "Block inset", "auto", "positioned"),
  text("inset-block-start", "Block start inset", "auto", "positioned"),
  text("inset-block-end", "Block end inset", "auto", "positioned"),
  text("inset-inline", "Inline inset", "auto", "positioned"),
  text("inset-inline-start", "Inline start inset", "auto", "positioned"),
  text("inset-inline-end", "Inline end inset", "auto", "positioned"),
  text("top", "Top", "auto", "positioned"),
  text("right", "Right", "auto", "positioned"),
  text("bottom", "Bottom", "auto", "positioned"),
  text("left", "Left", "auto", "positioned"),
  number("z-index", "Stack order", 0, "", "positioned", { stepper: true }),
  text("width", "Width", "auto", "sizable"),
  text("min-width", "Minimum width", "0px", "sizable"),
  text("max-width", "Maximum width", "none", "sizable"),
  text("height", "Height", "auto", "sizable"),
  text("min-height", "Minimum height", "0px", "sizable"),
  text("max-height", "Maximum height", "none", "sizable"),
  text("inline-size", "Inline size", "auto", "sizable"),
  text("min-inline-size", "Minimum inline size", "0px", "sizable"),
  text("max-inline-size", "Maximum inline size", "none", "sizable"),
  text("block-size", "Block size", "auto", "sizable"),
  text("min-block-size", "Minimum block size", "0px", "sizable"),
  text("max-block-size", "Maximum block size", "none", "sizable"),
  text("aspect-ratio", "Aspect ratio", "auto", "sizable"),
  select("overflow", "Overflow", OVERFLOW_VALUES),
  select("overflow-x", "Horizontal overflow", OVERFLOW_VALUES),
  select("overflow-y", "Vertical overflow", OVERFLOW_VALUES),
  select("overflow-block", "Block overflow", OVERFLOW_VALUES),
  select("overflow-inline", "Inline overflow", OVERFLOW_VALUES),
  text("overflow-clip-margin", "Overflow clip margin", "0px"),
  select("float", "Float", ["none", "left", "right", "inline-start", "inline-end"]),
  select("clear", "Clear", ["none", "left", "right", "both", "inline-start", "inline-end"]),
  text("margin", "Margin", "0px"),
  text("margin-block", "Block margin", "0px"),
  text("margin-block-start", "Block start margin", "0px"),
  text("margin-block-end", "Block end margin", "0px"),
  text("margin-inline", "Inline margin", "0px"),
  text("margin-inline-start", "Inline start margin", "0px"),
  text("margin-inline-end", "Inline end margin", "0px"),
  text("margin-top", "Top margin", "0px"),
  text("margin-right", "Right margin", "0px"),
  text("margin-bottom", "Bottom margin", "0px"),
  text("margin-left", "Left margin", "0px"),
  text("padding", "Padding", "0px"),
  text("padding-block", "Block padding", "0px"),
  text("padding-block-start", "Block start padding", "0px"),
  text("padding-block-end", "Block end padding", "0px"),
  text("padding-inline", "Inline padding", "0px"),
  text("padding-inline-start", "Inline start padding", "0px"),
  text("padding-inline-end", "Inline end padding", "0px"),
  text("padding-top", "Top padding", "0px"),
  text("padding-right", "Right padding", "0px"),
  text("padding-bottom", "Bottom padding", "0px"),
  text("padding-left", "Left padding", "0px"),
  text("gap", "Gap", "normal", "flex-or-grid-container"),
  text("row-gap", "Row gap", "normal", "flex-or-grid-container"),
  text("column-gap", "Column gap", "normal", "flex-grid-or-columns"),
  select("align-content", "Align content", ALIGN_VALUES, "normal", "flex-or-grid-container"),
  select("align-items", "Align items", ALIGN_VALUES, "normal", "flex-or-grid-container"),
  select("justify-content", "Justify content", ALIGN_VALUES, "normal", "flex-or-grid-container"),
  select("justify-items", "Justify items", ALIGN_VALUES, "normal", "grid-container"),
  select("place-content", "Place content", ALIGN_VALUES, "normal", "flex-or-grid-container"),
  select("place-items", "Place items", ALIGN_VALUES, "normal", "grid-container"),
  select("align-self", "Align self", ALIGN_VALUES, "auto", "flex-or-grid-item"),
  select("justify-self", "Justify self", ALIGN_VALUES, "auto", "grid-item"),
  select("place-self", "Place self", ALIGN_VALUES, "auto", "grid-item"),
  select("flex-direction", "Flex direction", ["row", "row-reverse", "column", "column-reverse"], "row", "flex-container"),
  select("flex-wrap", "Flex wrap", ["nowrap", "wrap", "wrap-reverse"], "nowrap", "flex-container"),
  text("flex-flow", "Flex flow", "row nowrap", "flex-container"),
  text("flex", "Flex", "0 1 auto", "flex-item"),
  number("flex-grow", "Flex grow", 0, "", "flex-item", { min: 0, step: 0.1 }),
  number("flex-shrink", "Flex shrink", 1, "", "flex-item", { min: 0, step: 0.1 }),
  text("flex-basis", "Flex basis", "auto", "flex-item"),
  number("order", "Order", 0, "", "flex-or-grid-item", { stepper: true }),
  text("grid", "Grid", "none", "grid-container"),
  text("grid-template", "Grid template", "none", "grid-container"),
  text("grid-template-areas", "Grid template areas", "none", "grid-container"),
  text("grid-template-columns", "Grid template columns", "none", "grid-container"),
  text("grid-template-rows", "Grid template rows", "none", "grid-container"),
  text("grid-auto-flow", "Grid auto flow", "row", "grid-container"),
  text("grid-auto-columns", "Grid auto columns", "auto", "grid-container"),
  text("grid-auto-rows", "Grid auto rows", "auto", "grid-container"),
  text("grid-area", "Grid area", "auto", "grid-item"),
  text("grid-column", "Grid column", "auto", "grid-item"),
  text("grid-column-start", "Grid column start", "auto", "grid-item"),
  text("grid-column-end", "Grid column end", "auto", "grid-item"),
  text("grid-row", "Grid row", "auto", "grid-item"),
  text("grid-row-start", "Grid row start", "auto", "grid-item"),
  text("grid-row-end", "Grid row end", "auto", "grid-item"),
  text("columns", "Columns", "auto", "column-container"),
  text("column-count", "Column count", "auto", "column-container"),
  text("column-width", "Column width", "auto", "column-container"),
  text("column-fill", "Column fill", "balance", "multi-column"),
  text("column-span", "Column span", "none", "multi-column-item"),
  select("break-before", "Break before", ["auto", "avoid", "page", "column"]),
  select("break-after", "Break after", ["auto", "avoid", "page", "column"]),
  select("break-inside", "Break inside", ["auto", "avoid", "avoid-page", "avoid-column"]),
  select("box-decoration-break", "Box decoration break", ["slice", "clone"]),
  select("contain", "Contain", ["none", "strict", "content", "size", "layout", "style", "paint"]),
  select("content-visibility", "Content visibility", ["visible", "auto", "hidden"]),
  text("contain-intrinsic-size", "Intrinsic containment size", "none"),
];

const typography = [
  text("font", "Font", ""),
  text("font-family", "Font family", "sans-serif", "text"),
  text("font-size", "Font size", "16px", "text"),
  text("font-size-adjust", "Font size adjustment", "none", "text"),
  select("font-style", "Font style", ["normal", "italic", "oblique"], "normal", "text"),
  select("font-weight", "Font weight", ["100", "200", "300", "400", "500", "600", "700", "800", "900"], "400", "text"),
  select("font-stretch", "Font stretch", ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded", "extra-expanded", "ultra-expanded"], "normal", "text"),
  select("font-kerning", "Font kerning", ["auto", "normal", "none"], "auto", "text"),
  select("font-optical-sizing", "Font optical sizing", ["auto", "none"], "auto", "text"),
  text("font-feature-settings", "Font feature settings", "normal", "text"),
  text("font-variation-settings", "Font variation settings", "normal", "text"),
  text("font-synthesis", "Font synthesis", "weight style small-caps", "text"),
  text("font-variant", "Font variant", "normal", "text"),
  text("font-variant-alternates", "Font variant alternates", "normal", "text"),
  text("font-variant-caps", "Font variant caps", "normal", "text"),
  text("font-variant-east-asian", "Font variant East Asian", "normal", "text"),
  text("font-variant-emoji", "Font variant emoji", "normal", "text"),
  text("font-variant-ligatures", "Font variant ligatures", "normal", "text"),
  text("font-variant-numeric", "Font variant numeric", "normal", "text"),
  text("font-variant-position", "Font variant position", "normal", "text"),
  text("line-height", "Line height", "normal", "text"),
  text("letter-spacing", "Letter spacing", "normal", "text"),
  text("word-spacing", "Word spacing", "normal", "text"),
  select("text-align", "Text alignment", ["start", "end", "left", "right", "center", "justify", "match-parent"], "start", "text"),
  select("text-align-last", "Last-line alignment", ["auto", "start", "end", "left", "right", "center", "justify"], "auto", "text"),
  text("text-indent", "Text indent", "0px", "text"),
  select("text-transform", "Text transform", ["none", "capitalize", "uppercase", "lowercase", "full-width", "full-size-kana"], "none", "text"),
  text("text-decoration", "Text decoration", "none", "text"),
  text("text-decoration-line", "Text decoration line", "none", "text"),
  color("text-decoration-color", "Text decoration color", "#000000", "text"),
  select("text-decoration-style", "Text decoration style", ["solid", "double", "dotted", "dashed", "wavy"], "solid", "text"),
  text("text-decoration-thickness", "Text decoration thickness", "auto", "text"),
  text("text-underline-offset", "Underline offset", "auto", "text"),
  select("text-underline-position", "Underline position", ["auto", "under", "left", "right"], "auto", "text"),
  select("text-overflow", "Text overflow", ["clip", "ellipsis"], "clip", "text"),
  select("white-space", "White space", ["normal", "pre", "nowrap", "pre-wrap", "pre-line", "break-spaces"], "normal", "text"),
  select("white-space-collapse", "White-space collapsing", ["collapse", "preserve", "preserve-breaks", "preserve-spaces", "break-spaces"], "collapse", "text"),
  select("text-wrap", "Text wrapping", ["wrap", "nowrap", "balance", "pretty", "stable"], "wrap", "text"),
  select("overflow-wrap", "Overflow wrapping", ["normal", "break-word", "anywhere"], "normal", "text"),
  select("word-break", "Word breaking", ["normal", "break-all", "keep-all", "auto-phrase"], "normal", "text"),
  select("line-break", "Line breaking", ["auto", "loose", "normal", "strict", "anywhere"], "auto", "text"),
  select("hyphens", "Hyphenation", ["none", "manual", "auto"], "manual", "text"),
  text("hyphenate-character", "Hyphenation character", "auto", "text"),
  number("tab-size", "Tab size", 8, "", "text", { min: 0, stepper: true }),
  select("direction", "Text direction", ["ltr", "rtl"], "ltr", "text"),
  select("unicode-bidi", "Unicode bidi", ["normal", "embed", "isolate", "bidi-override", "isolate-override", "plaintext"], "normal", "text"),
  select("writing-mode", "Writing mode", ["horizontal-tb", "vertical-rl", "vertical-lr"], "horizontal-tb", "text"),
  select("text-orientation", "Text orientation", ["mixed", "upright", "sideways"], "mixed", "text"),
  select("vertical-align", "Vertical alignment", ["baseline", "sub", "super", "text-top", "text-bottom", "middle", "top", "bottom"], "baseline", "inline-or-table-cell"),
  text("line-clamp", "Line clamp", "none", "text"),
  select("list-style", "List style", ["none", "disc", "circle", "square", "decimal"], "none", "list-item"),
  text("list-style-type", "List marker type", "disc", "list-item"),
  select("list-style-position", "List marker position", ["inside", "outside"], "outside", "list-item"),
  text("list-style-image", "List marker image", "none", "list-item"),
];

const background = [
  color("color", "Foreground color", "#000000"),
  text("background", "Background", "none"),
  color("background-color", "Background color", "#00000000"),
  text("background-image", "Background image", "none"),
  text("background-position", "Background position", "0% 0%"),
  text("background-position-x", "Horizontal background position", "0%"),
  text("background-position-y", "Vertical background position", "0%"),
  text("background-size", "Background size", "auto"),
  select("background-repeat", "Background repeat", ["repeat", "repeat-x", "repeat-y", "no-repeat", "space", "round"], "repeat"),
  select("background-attachment", "Background attachment", ["scroll", "fixed", "local"], "scroll"),
  select("background-origin", "Background origin", ["border-box", "padding-box", "content-box"], "padding-box"),
  select("background-clip", "Background clip", ["border-box", "padding-box", "content-box", "text"], "border-box"),
  text("background-blend-mode", "Background blend mode", "normal"),
  color("fill", "SVG fill", "#000000", "svg"),
  number("fill-opacity", "SVG fill opacity", 1, "", "svg", { min: 0, max: 1, step: 0.01 }),
  select("fill-rule", "SVG fill rule", ["nonzero", "evenodd"], "nonzero", "svg"),
  color("stop-color", "SVG stop color", "#000000", "svg"),
  number("stop-opacity", "SVG stop opacity", 1, "", "svg", { min: 0, max: 1, step: 0.01 }),
];

const borders = [
  text("border", "Border", "none"),
  text("border-width", "Border width", "medium"),
  select("border-style", "Border style", ["none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"], "none"),
  color("border-color", "Border color", "#000000"),
  text("border-top", "Top border", "none"),
  text("border-right", "Right border", "none"),
  text("border-bottom", "Bottom border", "none"),
  text("border-left", "Left border", "none"),
  text("border-block", "Block border", "none"),
  text("border-block-start", "Block start border", "none"),
  text("border-block-end", "Block end border", "none"),
  text("border-inline", "Inline border", "none"),
  text("border-inline-start", "Inline start border", "none"),
  text("border-inline-end", "Inline end border", "none"),
  text("border-top-width", "Top border width", "medium"),
  text("border-right-width", "Right border width", "medium"),
  text("border-bottom-width", "Bottom border width", "medium"),
  text("border-left-width", "Left border width", "medium"),
  text("border-block-width", "Block border width", "medium"),
  text("border-inline-width", "Inline border width", "medium"),
  text("border-top-style", "Top border style", "none"),
  text("border-right-style", "Right border style", "none"),
  text("border-bottom-style", "Bottom border style", "none"),
  text("border-left-style", "Left border style", "none"),
  text("border-block-style", "Block border style", "none"),
  text("border-inline-style", "Inline border style", "none"),
  color("border-top-color", "Top border color", "#000000"),
  color("border-right-color", "Right border color", "#000000"),
  color("border-bottom-color", "Bottom border color", "#000000"),
  color("border-left-color", "Left border color", "#000000"),
  color("border-block-color", "Block border color", "#000000"),
  color("border-inline-color", "Inline border color", "#000000"),
  text("border-radius", "Border radius", "0px"),
  text("border-top-left-radius", "Top left radius", "0px"),
  text("border-top-right-radius", "Top right radius", "0px"),
  text("border-bottom-right-radius", "Bottom right radius", "0px"),
  text("border-bottom-left-radius", "Bottom left radius", "0px"),
  text("border-start-start-radius", "Start start radius", "0px"),
  text("border-start-end-radius", "Start end radius", "0px"),
  text("border-end-start-radius", "End start radius", "0px"),
  text("border-end-end-radius", "End end radius", "0px"),
  text("border-image", "Border image", "none"),
  text("border-image-source", "Border image source", "none"),
  text("border-image-slice", "Border image slice", "100%"),
  text("border-image-width", "Border image width", "1"),
  text("border-image-outset", "Border image outset", "0"),
  text("border-image-repeat", "Border image repeat", "stretch"),
  text("outline", "Outline", "none"),
  color("outline-color", "Outline color", "#000000"),
  select("outline-style", "Outline style", ["none", "auto", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"], "none"),
  text("outline-width", "Outline width", "medium"),
  text("outline-offset", "Outline offset", "0px"),
  select("border-collapse", "Border collapse", ["separate", "collapse"], "separate", "table"),
  text("border-spacing", "Border spacing", "0px", "table"),
  color("column-rule-color", "Column rule color", "#000000", "multi-column"),
  select("column-rule-style", "Column rule style", ["none", "dotted", "dashed", "solid", "double"], "none", "multi-column"),
  text("column-rule-width", "Column rule width", "medium", "multi-column"),
  text("column-rule", "Column rule", "medium none currentcolor", "multi-column"),
  color("stroke", "SVG stroke", "#000000", "svg"),
  number("stroke-opacity", "SVG stroke opacity", 1, "", "svg", { min: 0, max: 1, step: 0.01 }),
  text("stroke-width", "SVG stroke width", "1px", "svg"),
  select("stroke-linecap", "SVG line cap", ["butt", "round", "square"], "butt", "svg"),
  select("stroke-linejoin", "SVG line join", ["miter", "round", "bevel"], "miter", "svg"),
  number("stroke-miterlimit", "SVG miter limit", 4, "", "svg", { min: 1 }),
  text("stroke-dasharray", "SVG dash array", "none", "svg"),
  text("stroke-dashoffset", "SVG dash offset", "0", "svg"),
  text("marker", "SVG marker", "none", "svg"),
  text("marker-start", "SVG start marker", "none", "svg"),
  text("marker-mid", "SVG middle marker", "none", "svg"),
  text("marker-end", "SVG end marker", "none", "svg"),
  select("paint-order", "SVG paint order", ["normal", "fill", "stroke", "markers"], "normal", "svg"),
  select("vector-effect", "SVG vector effect", ["none", "non-scaling-stroke"], "none", "svg"),
];

const filters = [
  text("filter", "Filter", "none"),
  text("backdrop-filter", "Backdrop filter", "none"),
  select("color-interpolation-filters", "SVG filter color space", ["auto", "sRGB", "linearRGB"], "linearRGB", "svg"),
  color("flood-color", "SVG flood color", "#000000", "svg"),
  number("flood-opacity", "SVG flood opacity", 1, "", "svg", { min: 0, max: 1, step: 0.01 }),
  color("lighting-color", "SVG lighting color", "#ffffff", "svg"),
];

const shadows = [
  text("box-shadow", "Box shadow", "none"),
  text("text-shadow", "Text shadow", "none", "text"),
];

const transforms = [
  text("transform", "Transform", "none"),
  text("transform-origin", "Transform origin", "50% 50%"),
  select("transform-box", "Transform box", ["content-box", "border-box", "fill-box", "stroke-box", "view-box"], "border-box"),
  select("transform-style", "Transform style", ["flat", "preserve-3d"], "flat"),
  text("translate", "Translate", "none"),
  text("rotate", "Rotate", "none"),
  text("scale", "Scale", "none"),
  text("perspective", "Perspective", "none"),
  text("perspective-origin", "Perspective origin", "50% 50%"),
  select("backface-visibility", "Backface visibility", ["visible", "hidden"], "visible"),
];

const masks = [
  text("mask", "Mask", "none"),
  text("mask-image", "Mask image", "none"),
  text("mask-mode", "Mask mode", "match-source"),
  text("mask-position", "Mask position", "0% 0%"),
  text("mask-size", "Mask size", "auto"),
  text("mask-repeat", "Mask repeat", "repeat"),
  text("mask-origin", "Mask origin", "border-box"),
  text("mask-clip", "Mask clip", "border-box"),
  text("mask-composite", "Mask composite", "add"),
  select("mask-type", "SVG mask type", ["luminance", "alpha"], "luminance", "svg"),
];

const appearance = [
  number("opacity", "Opacity", 1, "", "all", { variant: "opacity", min: 0, max: 1, step: 0.01 }),
  select("visibility", "Visibility", ["visible", "hidden", "collapse"], "visible"),
  select("mix-blend-mode", "Blend mode", ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity", "plus-darker", "plus-lighter"], "normal"),
  select("isolation", "Isolation", ["auto", "isolate"], "auto"),
  text("clip-path", "Clip path", "none"),
  select("clip-rule", "SVG clip rule", ["nonzero", "evenodd"], "nonzero", "svg"),
  text("cursor", "Cursor", "auto"),
  select("pointer-events", "Pointer events", ["auto", "none", "visiblePainted", "visibleFill", "visibleStroke", "painted", "fill", "stroke", "all"], "auto"),
  select("user-select", "Text selection", ["auto", "text", "none", "contain", "all"], "auto"),
  select("resize", "Resize", ["none", "both", "horizontal", "vertical", "block", "inline"], "none", "resizable"),
  color("caret-color", "Caret color", "#000000", "editable"),
  text("caret-shape", "Caret shape", "auto", "editable"),
  color("accent-color", "Accent color", "#0d99ff", "form-control"),
  select("appearance", "Native appearance", ["none", "auto"], "auto", "form-control"),
  select("color-scheme", "Color scheme", ["normal", "light", "dark", "light dark"], "normal"),
  select("forced-color-adjust", "Forced color adjustment", ["auto", "none"], "auto"),
  select("object-fit", "Object fit", ["fill", "contain", "cover", "none", "scale-down"], "fill", "replaced"),
  text("object-position", "Object position", "50% 50%", "replaced"),
  select("image-rendering", "Image rendering", ["auto", "smooth", "high-quality", "crisp-edges", "pixelated"], "auto", "replaced-or-svg"),
  select("shape-rendering", "SVG shape rendering", ["auto", "optimizeSpeed", "crispEdges", "geometricPrecision"], "auto", "svg"),
  select("text-rendering", "Text rendering", ["auto", "optimizeSpeed", "optimizeLegibility", "geometricPrecision"], "auto", "text"),
  select("color-rendering", "SVG color rendering", ["auto", "optimizeSpeed", "optimizeQuality"], "auto", "svg"),
  select("color-interpolation", "SVG color interpolation", ["auto", "sRGB", "linearRGB"], "sRGB", "svg"),
  text("scroll-behavior", "Scroll behavior", "auto", "scroll-container"),
  text("scroll-margin", "Scroll margin", "0px"),
  text("scroll-padding", "Scroll padding", "auto", "scroll-container"),
  select("scroll-snap-type", "Scroll snap type", ["none", "x mandatory", "y mandatory", "both mandatory", "x proximity", "y proximity", "both proximity"], "none", "scroll-container"),
  text("scroll-snap-align", "Scroll snap alignment", "none"),
  select("overscroll-behavior", "Overscroll behavior", ["auto", "contain", "none"], "auto", "scroll-container"),
  select("touch-action", "Touch action", ["auto", "none", "pan-x", "pan-y", "manipulation"], "auto"),
];

export const CSS_PROPERTY_MODULES = Object.freeze([
  { id: "layout", label: "Layout", properties: layout },
  { id: "typography", label: "Typography", properties: typography },
  { id: "background", label: "Fills", properties: background },
  {
    id: "border-stroke-outline",
    label: "Border / Stroke / Outline",
    properties: borders,
  },
  { id: "filters", label: "Filters", properties: filters },
  { id: "shadow", label: "Shadow", properties: shadows },
  { id: "transforms", label: "Transforms", properties: transforms },
  { id: "mask", label: "Mask", properties: masks },
  { id: "appearance", label: "Appearance", properties: appearance },
].map((module) => Object.freeze({
  ...module,
  properties: Object.freeze(module.properties.map((property) => Object.freeze(property))),
})));

const moduleById = new Map(CSS_PROPERTY_MODULES.map((module) => [module.id, module]));
const propertyByName = new Map(
  CSS_PROPERTY_MODULES.flatMap((module) =>
    module.properties.map((property) => [
      property.property,
      { module, mapping: property },
    ]),
  ),
);

function elementFacts(element) {
  if (typeof Element === "undefined" || !(element instanceof Element)) {
    throw new TypeError("Expected a DOM Element");
  }
  const view = element.ownerDocument?.defaultView ?? globalThis;
  const style = view.getComputedStyle(element);
  const parentStyle = element.parentElement
    ? view.getComputedStyle(element.parentElement)
    : null;
  const display = style.display;
  const parentDisplay = parentStyle?.display ?? "";
  const tag = element.localName.toLowerCase();
  const isSvg = element.namespaceURI === "http://www.w3.org/2000/svg";
  const replacedTags = new Set([
    "audio", "canvas", "embed", "iframe", "img", "input", "object", "select",
    "textarea", "video",
  ]);
  const formTags = new Set(["button", "input", "meter", "option", "progress", "select", "textarea"]);
  const editable =
    element.matches?.("input, textarea") ||
    element.getAttribute("contenteditable") === "" ||
    element.getAttribute("contenteditable") === "true";
  return Object.freeze({
    element,
    style,
    tag,
    display,
    parentDisplay,
    isSvg,
    isReplaced: replacedTags.has(tag),
    isFormControl: formTags.has(tag),
    isEditable: Boolean(editable),
    isFlexContainer: display === "flex" || display === "inline-flex",
    isGridContainer: display === "grid" || display === "inline-grid",
    isFlexItem: parentDisplay === "flex" || parentDisplay === "inline-flex",
    isGridItem: parentDisplay === "grid" || parentDisplay === "inline-grid",
    isPositioned: style.position !== "static",
    isScrollable: [style.overflow, style.overflowX, style.overflowY].some(
      (value) => value === "auto" || value === "scroll",
    ),
    isTable:
      display.startsWith("table") ||
      ["table", "td", "th", "tr", "thead", "tbody", "tfoot"].includes(tag),
    isListItem: display === "list-item" || tag === "li",
    isInline: display === "inline",
    isMultiColumn:
      style.columnCount !== "auto" || style.columnWidth !== "auto",
  });
}

function ruleDecision(rule, facts) {
  const decisions = {
    all: [true, "Applies to rendered elements"],
    svg: [facts.isSvg, "Requires an SVG element"],
    text: [!facts.isReplaced, "Requires an element that can render text"],
    sizable: [!facts.isInline || facts.isReplaced, "Width and height do not apply to a non-replaced inline element"],
    positioned: [facts.isPositioned, "Requires the element's computed position to be non-static"],
    "flex-container": [facts.isFlexContainer, "Requires the element's computed display to be flex or inline-flex"],
    "grid-container": [facts.isGridContainer, "Requires the element's computed display to be grid or inline-grid"],
    "flex-or-grid-container": [facts.isFlexContainer || facts.isGridContainer, "Requires a flex or grid container"],
    "flex-grid-or-columns": [facts.isFlexContainer || facts.isGridContainer || facts.isMultiColumn, "Requires a flex, grid, or multicolumn container"],
    "flex-item": [facts.isFlexItem, "Requires a parent whose computed display is flex or inline-flex"],
    "grid-item": [facts.isGridItem, "Requires a parent whose computed display is grid or inline-grid"],
    "flex-or-grid-item": [facts.isFlexItem || facts.isGridItem, "Requires a flex or grid parent"],
    "column-container": [!facts.isInline || facts.isReplaced, "Multicolumn layout requires a non-inline box"],
    "multi-column": [facts.isMultiColumn, "Requires an active multicolumn context"],
    "multi-column-item": [facts.isMultiColumn, "Requires a multicolumn context"],
    "inline-or-table-cell": [facts.isInline || facts.display === "table-cell", "Requires an inline-level or table-cell box"],
    table: [facts.isTable, "Requires table layout"],
    "list-item": [facts.isListItem, "Requires a list-item box"],
    replaced: [facts.isReplaced, "Requires a replaced element such as img, video, or canvas"],
    "replaced-or-svg": [facts.isReplaced || facts.isSvg, "Requires a replaced or SVG element"],
    editable: [facts.isEditable, "Requires editable text"],
    "form-control": [facts.isFormControl, "Requires a form control"],
    resizable: [facts.style.overflow !== "visible" && !facts.isInline, "Requires a non-inline box whose overflow is not visible"],
    "scroll-container": [facts.isScrollable, "Requires a current scroll container"],
  };
  return decisions[rule] ?? [false, `Unknown applicability rule: ${rule}`];
}

function browserRecognizes(property, facts) {
  const css = facts.element.ownerDocument?.defaultView?.CSS;
  if (!css?.supports) return true;
  try {
    return css.supports(property, "initial");
  } catch {
    return false;
  }
}

function decisionFor(module, mapping, facts) {
  const [semantic, reason] = ruleDecision(mapping.applies, facts);
  const recognized = browserRecognizes(mapping.property, facts);
  const applicable = semantic && recognized;
  return Object.freeze({
    moduleId: module.id,
    moduleLabel: module.label,
    property: mapping.property,
    label: mapping.label,
    status: applicable ? "applicable" : "not-applicable",
    confidence: recognized ? "high" : "low",
    reason: !recognized
      ? "The current browser does not recognize this CSS property"
      : applicable
        ? `Applicable in the current computed state: ${reason}`
        : reason,
  });
}

export function analyzeElementStyleCapabilities(element) {
  const facts = elementFacts(element);
  const properties = CSS_PROPERTY_MODULES.flatMap((module) =>
    module.properties.map((mapping) => decisionFor(module, mapping, facts)),
  );
  const modules = CSS_PROPERTY_MODULES.map((module) => {
    const moduleProperties = properties.filter(
      (property) => property.moduleId === module.id && property.status === "applicable",
    );
    return Object.freeze({
      id: module.id,
      label: module.label,
      applicable: moduleProperties.length > 0,
      properties: Object.freeze(moduleProperties),
    });
  });
  return Object.freeze({
    mode: "element",
    tagName: facts.tag,
    display: facts.display,
    parentDisplay: facts.parentDisplay,
    modules: Object.freeze(modules),
    properties: Object.freeze(properties),
    applicableProperties: Object.freeze(
      properties.filter((property) => property.status === "applicable"),
    ),
  });
}

export function getElementStyleCapability(element, property) {
  const entry = propertyByName.get(property);
  if (!entry) return null;
  return decisionFor(entry.module, entry.mapping, elementFacts(element));
}

function parsedComputedValue(mapping, computedValue) {
  const value = computedValue.trim();
  if (!value) return mapping.definition.default;
  if (mapping.parser === "number") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : mapping.definition.default;
  }
  if (mapping.parser === "options") {
    const options = mapping.definition.options.map((option) =>
      typeof option === "string" ? option : option.value,
    );
    return options.includes(value) ? value : mapping.definition.default;
  }
  return value;
}

function configDefinition(mapping, value) {
  const definition = {
    ...mapping.definition,
    label: mapping.label,
    default: value,
  };
  if (!PROPSKIT_CONTROL_TYPES.has(definition.type)) {
    throw new TypeError(`Unsupported PropsKit control type: ${definition.type}`);
  }
  return definition;
}

export function createCssModuleConfig(
  moduleId,
  { element, values = {} } = {},
) {
  const module = moduleById.get(moduleId);
  if (!module) throw new RangeError(`Unknown CSS property module: ${moduleId}`);
  const facts = element ? elementFacts(element) : null;
  const capabilities = facts
    ? module.properties.map((mapping) => decisionFor(module, mapping, facts))
    : module.properties.map((mapping) =>
        Object.freeze({
          moduleId: module.id,
          moduleLabel: module.label,
          property: mapping.property,
          label: mapping.label,
          status: "applicable",
          confidence: "unconstrained",
          reason: "No element was supplied; all module properties are available",
        }),
      );
  const config = {};
  for (const mapping of module.properties) {
    const capability = capabilities.find(
      (entry) => entry.property === mapping.property,
    );
    if (capability.status !== "applicable") continue;
    const value = Object.prototype.hasOwnProperty.call(values, mapping.property)
      ? values[mapping.property]
      : facts
        ? parsedComputedValue(
            mapping,
            facts.style.getPropertyValue(mapping.property),
          )
        : mapping.definition.default;
    config[mapping.property] = configDefinition(mapping, value);
  }
  return Object.freeze({
    module: Object.freeze({ id: module.id, label: module.label }),
    mode: facts ? "element" : "unconstrained",
    config: Object.freeze(config),
    capabilities: Object.freeze(capabilities),
  });
}
