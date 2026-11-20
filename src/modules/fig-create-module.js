/*
PolyForm Shield License 1.0.0
https://polyformproject.org/licenses/shield/1.0.0
Required Notice: Copyright (c) 2026 Rogie King
Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)
*/
import {
  figCreateProps,
  figCreatePropsRoot,
} from "@rogieking/figui3/propskit.js";
import { createCssModuleConfig } from "./css-property-capabilities.js";
import { quoteFontFamily } from "../editor/runtime/fonts.js";

const ASPECT_RATIO_SQUARE_ICON_FILE =
  "icon.24.crop.aspect-ratio.square.svg";
const aspectRatioSquareIconUrl = new URL(
  import.meta.url.includes("/dist/")
    ? `../icons/${ASPECT_RATIO_SQUARE_ICON_FILE}`
    : `../../icons/${ASPECT_RATIO_SQUARE_ICON_FILE}`,
  import.meta.url,
).href;

const BLEND_MODE_GROUPS = [
  ["normal"],
  ["darken", "multiply", "plus-darker", "color-burn"],
  ["lighten", "screen", "plus-lighter", "color-dodge"],
  ["overlay", "soft-light", "hard-light"],
  ["difference", "exclusion"],
  ["hue", "saturation", "color", "luminosity"],
];

const APPEARANCE_PROPERTIES = [
  "visibility",
  "opacity",
  "border-radius",
  "mix-blend-mode",
];

const LAYOUT_PROPERTIES = [
  "left",
  "top",
  "width",
  "height",
  "aspect-ratio",
  "display",
  "flex-direction",
  "overflow",
];

const TYPOGRAPHY_PROPERTIES = [
  "font-family",
  "font-style",
  "font-weight",
  "font-size",
  "line-height",
  "letter-spacing",
  "text-align",
  "vertical-align",
];

const STROKE_PROPERTIES = [
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "stroke-dashoffset",
];

const OUTLINE_PROPERTIES = [
  "outline-color",
  "outline-style",
  "outline-width",
  "outline-offset",
];

const BORDER_STYLE_OPTIONS = [
  ["none", "None"],
  ["solid", "Solid"],
  ["dashed", "Dashed"],
  ["dotted", "Dotted"],
  ["double", "Double"],
  ["groove", "Groove"],
  ["ridge", "Ridge"],
  ["inset", "Inset"],
  ["outset", "Outset"],
];

const OUTLINE_STYLE_OPTIONS = [
  ...BORDER_STYLE_OPTIONS.filter(([value]) => value !== "none"),
  ["auto", "Auto"],
];

const OUTLINE_ALIGNMENT_OPTIONS = [
  ["inside", "Inside"],
  ["center", "Center"],
  ["outside", "Outside"],
  ["custom", "Custom"],
];

// Chromium's default focus-ring color (`-webkit-focus-ring-color`).
const DEFAULT_OUTLINE_COLOR = "#005fcc";

const BORDER_TARGET_OPTIONS = [
  ["all", "All"],
  ["top", "Top"],
  ["right", "Right"],
  ["bottom", "Bottom"],
  ["left", "Left"],
];

const BORDER_PROPERTIES = BORDER_TARGET_OPTIONS.flatMap(([target]) =>
  ["width", "style", "color"].map((part) =>
    target === "all" ? `border-${part}` : `border-${target}-${part}`,
  ),
);

function borderValuesPatch(current, patch) {
  if (typeof document === "undefined") return patch;
  const style = document.createElement("div").style;
  for (const values of [current, patch]) {
    for (const property of BORDER_PROPERTIES) {
      if (Object.prototype.hasOwnProperty.call(values, property)) {
        style.setProperty(property, String(values[property]));
      }
    }
  }
  return Object.fromEntries(Object.keys(current).map((property) => [
    property,
    style.getPropertyValue(property) || current[property],
  ]));
}

const STROKE_STYLE_OPTIONS = [
  ["solid", "Solid"],
  ["dashed", "Dashed"],
  ["dotted", "Dotted"],
  ["custom", "Custom"],
];

const STROKE_DASHARRAY_BY_STYLE = {
  solid: "none",
  dashed: "6 3",
  dotted: "1 2",
};

const FONT_FAMILIES = [
  "Inter",
  "Arial",
  "Georgia",
  "Helvetica",
  "Times New Roman",
  "Tilt Prism",
  "Verdana",
  "monospace",
  "sans-serif",
  "serif",
];

const FONT_WEIGHTS = [
  ["100", "Thin"],
  ["200", "Extra light"],
  ["300", "Light"],
  ["400", "Regular"],
  ["500", "Medium"],
  ["600", "Semi bold"],
  ["700", "Bold"],
  ["800", "Extra bold"],
  ["900", "Black"],
];

const TYPOGRAPHY_ICON_PATHS = {
  "text.line-height":
    "M17.5 17C17.7761 17 18 17.2239 18 17.5C18 17.7761 17.7761 18 17.5 18H6.5C6.22386 18 6 17.7761 6 17.5C6 17.2239 6.22386 17 6.5 17H17.5ZM12.25 8C12.467 8.00003 12.659 8.14016 12.7256 8.34668L14.9756 15.3467C15.06 15.6094 14.9159 15.8909 14.6533 15.9756C14.3906 16.06 14.1091 15.9159 14.0244 15.6533L13.4932 14H10.5068L9.97559 15.6533C9.89092 15.9159 9.60942 16.06 9.34668 15.9756C9.08409 15.8909 8.93998 15.6094 9.02441 15.3467L11.2744 8.34668L11.3047 8.27246C11.389 8.10726 11.5601 8.00002 11.75 8H12.25ZM10.8281 13H13.1719L12 9.35449L10.8281 13ZM17.5 6C17.7761 6 18 6.22386 18 6.5C18 6.77614 17.7761 7 17.5 7H6.5C6.22386 7 6 6.77614 6 6.5C6 6.22386 6.22386 6 6.5 6H17.5Z",
  "text.letter-spacing":
    "M6.5 6C6.77614 6 7 6.22386 7 6.5V17.5C7 17.7761 6.77614 18 6.5 18C6.22386 18 6 17.7761 6 17.5V6.5C6 6.22386 6.22386 6 6.5 6ZM17.5 6C17.7761 6 18 6.22386 18 6.5V17.5C18 17.7761 17.7761 18 17.5 18C17.2239 18 17 17.7761 17 17.5V6.5C17 6.22386 17.2239 6 17.5 6ZM12.25 9C12.4625 9 12.6515 9.13445 12.7217 9.33496L14.4717 14.335C14.5629 14.5956 14.4257 14.8805 14.165 14.9717C13.9045 15.0628 13.6195 14.9256 13.5283 14.665L13.1211 13.5H10.8789L10.4717 14.665C10.3804 14.9256 10.0956 15.0629 9.83496 14.9717C9.57446 14.8804 9.43719 14.5955 9.52832 14.335L11.2783 9.33496L11.3096 9.2627C11.3957 9.10272 11.5642 9.00007 11.75 9H12.25ZM11.2295 12.5H12.7705L12 10.2979L11.2295 12.5Z",
  "text.align-left":
    "M14.5 15C14.7761 15 15 15.2239 15 15.5C15 15.7761 14.7761 16 14.5 16H5.5C5.22386 16 5 15.7761 5 15.5C5 15.2239 5.22386 15 5.5 15H14.5ZM12.5 11C12.7761 11 13 11.2239 13 11.5C13 11.7761 12.7761 12 12.5 12H5.5C5.22386 12 5 11.7761 5 11.5C5 11.2239 5.22386 11 5.5 11H12.5ZM18.5 7C18.7761 7 19 7.22386 19 7.5C19 7.77614 18.7761 8 18.5 8H5.5C5.22386 8 5 7.77614 5 7.5C5 7.22386 5.22386 7 5.5 7H18.5Z",
  "text.align-center":
    "M16.5 15C16.7761 15 17 15.2239 17 15.5C17 15.7761 16.7761 16 16.5 16H7.5C7.22386 16 7 15.7761 7 15.5C7 15.2239 7.22386 15 7.5 15H16.5ZM15.5 11C15.7761 11 16 11.2239 16 11.5C16 11.7761 15.7761 12 15.5 12H8.5C8.22386 12 8 11.7761 8 11.5C8 11.2239 8.22386 11 8.5 11H15.5ZM18.5 7C18.7761 7 19 7.22386 19 7.5C19 7.77614 18.7761 8 18.5 8H5.5C5.22386 8 5 7.77614 5 7.5C5 7.22386 5.22386 7 5.5 7H18.5Z",
  "text.align-right":
    "M9.5 15C9.22386 15 9 15.2239 9 15.5C9 15.7761 9.22386 16 9.5 16H18.5C18.7761 16 19 15.7761 19 15.5C19 15.2239 18.7761 15 18.5 15H9.5ZM11.5 11C11.2239 11 11 11.2239 11 11.5C11 11.7761 11.2239 12 11.5 12H18.5C18.7761 12 19 11.7761 19 11.5C19 11.2239 18.7761 11 18.5 11H11.5ZM5.5 7C5.22386 7 5 7.22386 5 7.5C5 7.77614 5.22386 8 5.5 8H18.5C18.7761 8 19 7.77614 19 7.5C19 7.22386 18.7761 7 18.5 7H5.5Z",
  "text.align-top":
    "M11.2246 7.08203C11.4187 6.95387 11.6827 6.97562 11.8535 7.14648L14.8535 10.1465C15.0488 10.3417 15.0488 10.6583 14.8535 10.8535C14.6583 11.0488 14.3417 11.0488 14.1465 10.8535L12 8.70703V16.5C12 16.7761 11.7761 17 11.5 17C11.2239 17 11 16.7761 11 16.5V8.70703L8.85352 10.8535C8.65825 11.0488 8.34175 11.0488 8.14648 10.8535C7.95122 10.6583 7.95122 10.3417 8.14648 10.1465L11.1465 7.14648L11.2246 7.08203ZM17.5 5C17.7761 5 18 5.22386 18 5.5C18 5.77614 17.7761 6 17.5 6H5.5C5.22386 6 5 5.77614 5 5.5C5 5.22386 5.22386 5 5.5 5H17.5Z",
  "text.align-middle":
    "M11.2246 13.082C11.4187 12.9539 11.6827 12.9756 11.8535 13.1465L13.8535 15.1465C14.0488 15.3417 14.0488 15.6583 13.8535 15.8535C13.6583 16.0488 13.3417 16.0488 13.1465 15.8535L12 14.707V18.5C12 18.7761 11.7761 19 11.5 19C11.2239 19 11 18.7761 11 18.5V14.707L9.85352 15.8535C9.65825 16.0488 9.34175 16.0488 9.14648 15.8535C8.95122 15.6583 8.95122 15.3417 9.14648 15.1465L11.1465 13.1465L11.2246 13.082ZM17.5 11C17.7761 11 18 11.2239 18 11.5C18 11.7761 17.7761 12 17.5 12H5.5C5.22386 12 5 11.7761 5 11.5C5 11.2239 5.22386 11 5.5 11H17.5ZM11.5 4C11.7761 4 12 4.22386 12 4.5V8.29297L13.1465 7.14648C13.3417 6.95122 13.6583 6.95122 13.8535 7.14648C14.0488 7.34175 14.0488 7.65825 13.8535 7.85352L11.8535 9.85352C11.6827 10.0244 11.4187 10.0461 11.2246 9.91797L11.1465 9.85352L9.14648 7.85352C8.95122 7.65825 8.95122 7.34175 9.14648 7.14648C9.34175 6.95122 9.65825 6.95122 9.85352 7.14648L11 8.29297V4.5C11 4.22386 11.2239 4 11.5 4Z",
  "text.align-bottom":
    "M17.5 18C17.7761 18 18 18.2239 18 18.5C18 18.7761 17.7761 19 17.5 19H5.5C5.22386 19 5 18.7761 5 18.5C5 18.2239 5.22386 18 5.5 18H17.5ZM11.5 7C11.7761 7 12 7.22386 12 7.5V15.293L14.1465 13.1465C14.3417 12.9512 14.6583 12.9512 14.8535 13.1465C15.0488 13.3417 15.0488 13.6583 14.8535 13.8535L11.8535 16.8535C11.6827 17.0244 11.4187 17.0461 11.2246 16.918L11.1465 16.8535L8.14648 13.8535C7.95122 13.6583 7.95122 13.3417 8.14648 13.1465C8.34175 12.9512 8.65825 12.9512 8.85352 13.1465L11 15.293V7.5C11 7.22386 11.2239 7 11.5 7Z",
};

const OPACITY_ICON =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16.2041 6.01074C17.2128 6.113 18 6.96435 18 8V16L17.9893 16.2041C17.8938 17.1457 17.1457 17.8938 16.2041 17.9893L16 18H8C6.96435 18 6.113 17.2128 6.01074 16.2041L6 16V8C6 6.89543 6.89543 6 8 6H16L16.2041 6.01074ZM8 7C7.44772 7 7 7.44772 7 8V16C7 16.5523 7.44772 17 8 17H16C16.5523 17 17 16.5523 17 16V8C17 7.44772 16.5523 7 16 7H8ZM9 14.5C9.27614 14.5 9.5 14.7239 9.5 15C9.5 15.2761 9.27614 15.5 9 15.5C8.72386 15.5 8.5 15.2761 8.5 15C8.5 14.7239 8.72386 14.5 9 14.5ZM11 14.5C11.2761 14.5 11.5 14.7239 11.5 15C11.5 15.2761 11.2761 15.5 11 15.5C10.7239 15.5 10.5 15.2761 10.5 15C10.5 14.7239 10.7239 14.5 11 14.5ZM13 14.5C13.2761 14.5 13.5 14.7239 13.5 15C13.5 15.2761 13.2761 15.5 13 15.5C12.7239 15.5 12.5 15.2761 12.5 15C12.5 14.7239 12.7239 14.5 13 14.5ZM15 14.5C15.2761 14.5 15.5 14.7239 15.5 15C15.5 15.2761 15.2761 15.5 15 15.5C14.7239 15.5 14.5 15.2761 14.5 15C14.5 14.7239 14.7239 14.5 15 14.5ZM11 12.5C11.2761 12.5 11.5 12.7239 11.5 13C11.5 13.2761 11.2761 13.5 11 13.5C10.7239 13.5 10.5 13.2761 10.5 13C10.5 12.7239 10.7239 12.5 11 12.5ZM13 12.5C13.2761 12.5 13.5 12.7239 13.5 13C13.5 13.2761 13.2761 13.5 13 13.5C12.7239 13.5 12.5 13.2761 12.5 13C12.5 12.7239 12.7239 12.5 13 12.5ZM15 12.5C15.2761 12.5 15.5 12.7239 15.5 13C15.5 13.2761 15.2761 13.5 15 13.5C14.7239 13.5 14.5 13.2761 14.5 13C14.5 12.7239 14.7239 12.5 15 12.5ZM13 10.5C13.2761 10.5 13.5 10.7239 13.5 11C13.5 11.2761 13.2761 11.5 13 11.5C12.7239 11.5 12.5 11.2761 12.5 11C12.5 10.7239 12.7239 10.5 13 10.5ZM15 10.5C15.2761 10.5 15.5 10.7239 15.5 11C15.5 11.2761 15.2761 11.5 15 11.5C14.7239 11.5 14.5 11.2761 14.5 11C14.5 10.7239 14.7239 10.5 15 10.5ZM15 8.5C15.2761 8.5 15.5 8.72386 15.5 9C15.5 9.27614 15.2761 9.5 15 9.5C14.7239 9.5 14.5 9.27614 14.5 9C14.5 8.72386 14.7239 8.5 15 8.5Z" fill="currentColor" fill-opacity=".9"/></svg>';
const BORDER_RADIUS_ICON =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15.5 8C15.7761 8 16 8.22386 16 8.5C16 8.77614 15.7761 9 15.5 9H12.5C11.7917 9 11.2902 9.00022 10.8984 9.03223C10.5126 9.06377 10.2769 9.12345 10.0918 9.21777C9.71554 9.40951 9.40951 9.71554 9.21777 10.0918C9.12345 10.2769 9.06377 10.5126 9.03223 10.8984C9.00022 11.2902 9 11.7917 9 12.5V15.5C9 15.7761 8.77614 16 8.5 16C8.22386 16 8 15.7761 8 15.5V12.5C8 11.8082 8.00003 11.2593 8.03613 10.8174C8.07272 10.3696 8.14901 9.98732 8.32715 9.6377C8.61472 9.07347 9.07347 8.61472 9.6377 8.32715C9.98732 8.14901 10.3696 8.07272 10.8174 8.03613C11.2593 8.00003 11.8082 8 12.5 8H15.5Z" fill="currentColor" fill-opacity=".9"/></svg>';
const STROKE_WIDTH_ICON =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.25 14C17.6642 14 18 14.3358 18 14.75V17.25C18 17.6642 17.6642 18 17.25 18H6.75C6.33579 18 6 17.6642 6 17.25V14.75C6 14.3358 6.33579 14 6.75 14H17.25ZM7 17H17V15H7V17ZM17.25 9C17.6642 9 18 9.33579 18 9.75V11.25C18 11.6642 17.6642 12 17.25 12H6.75C6.33579 12 6 11.6642 6 11.25V9.75C6 9.33579 6.33579 9 6.75 9H17.25ZM7 11H17V10H7V11ZM17.5 6C17.7761 6 18 6.22386 18 6.5C18 6.77614 17.7761 7 17.5 7H6.5C6.22386 7 6 6.77614 6 6.5C6 6.22386 6.22386 6 6.5 6H17.5Z" fill="currentColor" fill-opacity=".9"/></svg>';
const BLEND_MODE_ICON =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11.3525 5.62264C11.714 5.26055 12.286 5.26055 12.6475 5.62264C13.9997 6.97736 17 10.2893 17 13.0006C16.9999 16.5004 14.4999 18.0006 12 18.0006C9.50007 18.0006 7.00013 16.5004 7 13.0006C7 10.2893 10.0003 6.97736 11.3525 5.62264ZM12 6.39217C11.3421 7.05594 10.337 8.14317 9.49316 9.36971C8.59711 10.6723 8 11.9642 8 13.0006C8.00006 14.4911 8.52166 15.4539 9.21777 16.0572C9.93729 16.6807 10.9381 17.0006 12 17.0006C13.0619 17.0006 14.0627 16.6807 14.7822 16.0572C15.4783 15.4539 15.9999 14.4911 16 13.0006C16 11.9642 15.4029 10.6723 14.5068 9.36971C13.663 8.14317 12.6579 7.05594 12 6.39217Z" fill="currentColor" fill-opacity=".9"/></svg>';
const LAYOUT_MODE_ICON_PATHS = {
  freeform:
    "M11.6533 13.0078C12.4097 13.0846 13 13.7233 13 14.5V16.5L12.9922 16.6533C12.9205 17.3593 12.3593 17.9205 11.6533 17.9922L11.5 18H9.5C8.72334 18 8.08461 17.4097 8.00781 16.6533L8 16.5V14.5C8 13.6716 8.67157 13 9.5 13H11.5L11.6533 13.0078ZM9.5 14C9.22386 14 9 14.2239 9 14.5V16.5C9 16.7761 9.22386 17 9.5 17H11.5C11.7761 17 12 16.7761 12 16.5V14.5C12 14.2239 11.7761 14 11.5 14H9.5ZM16.6533 8.00781C17.4097 8.08461 18 8.72334 18 9.5V11.5L17.9922 11.6533C17.9205 12.3593 17.3593 12.9205 16.6533 12.9922L16.5 13H14.5C13.7233 13 13.0846 12.4097 13.0078 11.6533L13 11.5V9.5C13 8.67157 13.6716 8 14.5 8H16.5L16.6533 8.00781ZM14.5 9C14.2239 9 14 9.22386 14 9.5V11.5C14 11.7761 14.2239 12 14.5 12H16.5C16.7761 12 17 11.7761 17 11.5V9.5C17 9.22386 16.7761 9 16.5 9H14.5ZM9.65332 6.00781C10.4097 6.08461 11 6.72334 11 7.5V9.5L10.9922 9.65332C10.9205 10.3593 10.3593 10.9205 9.65332 10.9922L9.5 11H7.5C6.72334 11 6.08461 10.4097 6.00781 9.65332L6 9.5V7.5C6 6.67157 6.67157 6 7.5 6H9.5L9.65332 6.00781ZM7.5 7C7.22386 7 7 7.22386 7 7.5V9.5C7 9.77614 7.22386 10 7.5 10H9.5C9.77614 10 10 9.77614 10 9.5V7.5C10 7.22386 9.77614 7 9.5 7H7.5Z",
  vertical:
    "M9.65356 13.0073C10.41 13.0841 11.0002 13.7228 11.0002 14.4995V16.4995L10.9924 16.6528C10.9208 17.3588 10.3596 17.92 9.65356 17.9917L9.50024 17.9995H7.50024C6.72358 17.9995 6.08485 17.4092 6.00806 16.6528L6.00024 16.4995V14.4995C6.00024 13.6711 6.67182 12.9995 7.50024 12.9995H9.50024L9.65356 13.0073ZM15.5002 5.99951C15.7762 5.99964 16.0001 6.2236 16.0002 6.49951V16.2935L17.1458 15.147C17.341 14.9517 17.6585 14.9517 17.8538 15.147C18.0485 15.3422 18.0488 15.6589 17.8538 15.854L15.8538 17.854C15.6586 18.0489 15.342 18.0488 15.1467 17.854L13.1467 15.854C12.9515 15.6588 12.9517 15.3423 13.1467 15.147C13.342 14.9517 13.6585 14.9517 13.8538 15.147L15.0002 16.2935V6.49951C15.0004 6.22352 15.2242 5.99951 15.5002 5.99951ZM7.50024 13.9995C7.2241 13.9995 7.00024 14.2234 7.00024 14.4995V16.4995C7.00024 16.7757 7.2241 16.9995 7.50024 16.9995H9.50024C9.77639 16.9995 10.0002 16.7757 10.0002 16.4995V14.4995C10.0002 14.2234 9.77639 13.9995 9.50024 13.9995H7.50024ZM9.65356 6.00732C10.41 6.08412 11.0002 6.72285 11.0002 7.49951V9.49951L10.9924 9.65283C10.9208 10.3588 10.3596 10.92 9.65356 10.9917L9.50024 10.9995H7.50024C6.72358 10.9995 6.08485 10.4092 6.00806 9.65283L6.00024 9.49951V7.49951C6.00024 6.67108 6.67182 5.99951 7.50024 5.99951H9.50024L9.65356 6.00732ZM7.50024 6.99951C7.2241 6.99951 7.00024 7.22337 7.00024 7.49951V9.49951C7.00024 9.77565 7.2241 9.99951 7.50024 9.99951H9.50024C9.77639 9.99951 10.0002 9.77565 10.0002 9.49951V7.49951C10.0002 7.22337 9.77639 6.99951 9.50024 6.99951H7.50024Z",
  horizontal:
    "M15.1469 13.1465C15.3421 12.9516 15.6587 12.9516 15.8539 13.1465L17.8539 15.1465C18.0489 15.3416 18.0488 15.6583 17.8539 15.8535L15.8539 17.8535C15.6587 18.0487 15.3421 18.0487 15.1469 17.8535C14.9516 17.6583 14.9516 17.3417 15.1469 17.1465L16.2933 16H6.50037C6.22422 16 6.00037 15.7761 6.00037 15.5C6.00049 15.224 6.2243 15 6.50037 15H16.2933L15.1469 13.8535C14.9518 13.6582 14.9517 13.3417 15.1469 13.1465ZM9.65369 6.00781C10.4101 6.08461 11.0004 6.72334 11.0004 7.5V9.5L10.9926 9.65332C10.9209 10.3593 10.3597 10.9205 9.65369 10.9922L9.50037 11H7.50037C6.7237 11 6.08498 10.4097 6.00818 9.65332L6.00037 9.5V7.5C6.00037 6.67157 6.67194 6 7.50037 6H9.50037L9.65369 6.00781ZM16.6537 6.00781C17.4101 6.08461 18.0004 6.72334 18.0004 7.5V9.5L17.9926 9.65332C17.9209 10.3593 17.3597 10.9205 16.6537 10.9922L16.5004 11H14.5004C13.7237 11 13.085 10.4097 13.0082 9.65332L13.0004 9.5V7.5C13.0004 6.67157 13.6719 6 14.5004 6H16.5004L16.6537 6.00781ZM14.5004 7C14.2242 7 14.0004 7.22386 14.0004 7.5V9.5C14.0004 9.77614 14.2242 10 14.5004 10H16.5004C16.7765 10 17.0004 9.77614 17.0004 9.5V7.5C17.0004 7.22386 16.7765 7 16.5004 7H14.5004ZM7.50037 7C7.22422 7 7.00037 7.22386 7.00037 7.5V9.5C7.00037 9.77614 7.22422 10 7.50037 10H9.50037C9.77651 10 10.0004 9.77614 10.0004 9.5V7.5C10.0004 7.22386 9.77651 7 9.50037 7H7.50037Z",
  grid:
    "M9.65332 13.0078C10.4097 13.0846 11 13.7233 11 14.5V16.5L10.9922 16.6533C10.9205 17.3593 10.3593 17.9205 9.65332 17.9922L9.5 18H7.5C6.72334 18 6.08461 17.4097 6.00781 16.6533L6 16.5V14.5C6 13.6716 6.67157 13 7.5 13H9.5L9.65332 13.0078ZM16.6533 13.0078C17.4097 13.0846 18 13.7233 18 14.5V16.5L17.9922 16.6533C17.9205 17.3593 17.3593 17.9205 16.6533 17.9922L16.5 18H14.5C13.7233 18 13.0846 17.4097 13.0078 16.6533L13 16.5V14.5C13 13.6716 13.6716 13 14.5 13H16.5L16.6533 13.0078ZM7.5 14C7.22386 14 7 14.2239 7 14.5V16.5C7 16.7761 7.22386 17 7.5 17H9.5C9.77614 17 10 16.7761 10 16.5V14.5C10 14.2239 9.77614 14 9.5 14H7.5ZM14.5 14C14.2239 14 14 14.2239 14 14.5V16.5C14 16.7761 14.2239 17 14.5 17H16.5C16.7761 17 17 16.7761 17 16.5V14.5C17 14.2239 16.7761 14 16.5 14H14.5ZM9.65332 6.00781C10.4097 6.08461 11 6.72334 11 7.5V9.5L10.9922 9.65332C10.9205 10.3593 10.3593 10.9205 9.65332 10.9922L9.5 11H7.5C6.72334 11 6.08461 10.4097 6.00781 9.65332L6 9.5V7.5C6 6.67157 6.67157 6 7.5 6H9.5L9.65332 6.00781ZM16.6533 6.00781C17.4097 6.08461 18 6.72334 18 7.5V9.5L17.9922 9.65332C17.9205 10.3593 17.3593 10.9205 16.6533 10.9922L16.5 11H14.5C13.7233 11 13.0846 10.4097 13.0078 9.65332L13 9.5V7.5C13 6.67157 13.6716 6 14.5 6H16.5L16.6533 6.00781ZM7.5 7C7.22386 7 7 7.22386 7 7.5V9.5C7 9.77614 7.22386 10 7.5 10H9.5C9.77614 10 10 9.77614 10 9.5V7.5C10 7.22386 9.77614 7 9.5 7H7.5ZM14.5 7C14.2239 7 14 7.22386 14 7.5V9.5C14 9.77614 14.2239 10 14.5 10H16.5C16.7761 10 17 9.77614 17 9.5V7.5C17 7.22386 16.7761 7 16.5 7H14.5Z",
};

function resolveTarget(target) {
  if (typeof document === "undefined") {
    throw new Error("figCreateModule().mount() requires a browser document.");
  }
  const resolved =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!(resolved instanceof HTMLElement)) {
    throw new Error("figCreateModule().mount() requires a valid target.");
  }
  return resolved;
}

function eventValue(event) {
  const detail = event instanceof CustomEvent ? event.detail : undefined;
  if (typeof detail === "string" || typeof detail === "number") return detail;
  if (detail && typeof detail === "object" && "value" in detail) {
    return detail.value;
  }
  return event.currentTarget?.value ?? "";
}

function withControlTooltip(control, text) {
  if (control?.localName === "fig-tooltip") return control;
  const tooltip = document.createElement("fig-tooltip");
  tooltip.setAttribute(
    "text",
    text ||
      control?.getAttribute?.("aria-label") ||
      control?.getAttribute?.("label") ||
      control?.localName ||
      "Input",
  );
  tooltip.append(control);
  return tooltip;
}

function blendModeLabel(mode) {
  const words = mode.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function supportedBlendModeGroups() {
  return BLEND_MODE_GROUPS.map((group) =>
    group.filter(
      (mode) =>
        typeof CSS === "undefined" ||
        typeof CSS.supports !== "function" ||
        CSS.supports("mix-blend-mode", mode),
    ),
  ).filter((group) => group.length > 0);
}

function appendSvgIcon(parent, svg) {
  const icon = document.createElement("fig-icon");
  icon.innerHTML = svg;
  parent.append(icon);
  return icon;
}

function layoutModeIcon(mode) {
  const path = LAYOUT_MODE_ICON_PATHS[mode];
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${path}" fill="currentColor" fill-opacity=".9"/></svg>`;
}

function numericCssValue(value, unit) {
  const number = Number(value);
  return `${Number.isFinite(number) ? number : 0}${unit}`;
}

function numericValue(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fontFamilyLabel(value) {
  return String(value || "Inter")
    .split(",")[0]
    .trim()
    .replace(/^(['"])(.*)\1$/, "$2");
}

function fontPickerFamilyValue(event) {
  const detail = event instanceof CustomEvent ? event.detail : null;
  if (detail?.css?.fontFamily) return detail.css.fontFamily;
  const value = detail?.value ?? event.currentTarget?.value;
  return quoteFontFamily(
    value && typeof value === "object" ? value.family : value,
  );
}

function typographyIcon(name) {
  const path = TYPOGRAPHY_ICON_PATHS[name];
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${path}" fill="currentColor" fill-opacity=".9"/></svg>`;
}

function appendTypographyIcon(parent, name, slot) {
  const icon = appendSvgIcon(parent, typographyIcon(name));
  if (slot) icon.setAttribute("slot", slot);
  return icon;
}

let nextLayoutModuleId = 0;

function mountLayoutModule(target, kit, emit) {
  const root = document.createElement("fig-module-layout");
  root.className = "fig-module";
  root.dataset.module = "layout";
  root.dataset.layoutModule = "";

  const group = document.createElement("fig-group");
  group.className = "layout-properties-group";

  const header = document.createElement("fig-header");
  header.setAttribute("borderless", "");
  const title = document.createElement("h3");
  nextLayoutModuleId += 1;
  title.id = `fig-layout-module-title-${nextLayoutModuleId}`;
  title.textContent = "Layout";
  header.append(title);
  group.append(header);

  const has = (property) =>
    Object.prototype.hasOwnProperty.call(kit.values, property);
  const inputs = new Map();
  const sizeInputs = new Map();
  let aspectRatioButton = null;
  let handleAspectRatioClick = null;

  const calculatedAspectRatio = () => {
    const width = sizeInputs.get("width")?.value;
    const height = sizeInputs.get("height")?.value;
    return Number.isFinite(width) &&
      width > 0 &&
      Number.isFinite(height) &&
      height > 0
      ? `${width} / ${height}`
      : "1 / 1";
  };
  const emitConstrainedSize = (property, phase, event) => {
    if (aspectRatioButton?.selected !== true) return;
    const [widthRatio, heightRatio = 1] = String(kit.values["aspect-ratio"]).split("/").map(Number);
    const ratio = widthRatio / heightRatio;
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    const otherProperty = property === "width" ? "height" : "width";
    const current = sizeInputs.get(property);
    const other = sizeInputs.get(otherProperty);
    if (!current || !other || current.mode !== other.mode || current.mode === "Fill") return;
    other.value = Math.round((property === "width" ? current.value / ratio : current.value * ratio) * 1e6) / 1e6;
    emit(otherProperty, numericCssValue(other.value, other.mode === "Relative" ? "%" : "px"), phase, event);
  };

  const createNumberInput = (property, label, prefix, unit, minimum) => {
    if (!has(property)) return null;
    const input = document.createElement("fig-input-number");
    input.dataset.layoutProperty = property;
    input.style.cssText = "flex: 1 1 0; min-width: 0";
    input.setAttribute("default", "0");
    input.setAttribute("step", "1");
    input.setAttribute("steppers", "false");
    input.setAttribute("aria-label", label);
    if (minimum !== undefined) input.setAttribute("min", String(minimum));
    if (unit === "deg") input.setAttribute("units", "°");

    const prepend = document.createElement("fig-icon");
    prepend.setAttribute("slot", "prepend");
    if (prefix === "angle") prepend.setAttribute("name", "angle");
    else prepend.textContent = prefix;
    input.append(prepend);

    for (const phase of ["input", "change"]) {
      input.addEventListener(phase, (event) => {
        emit(
          property,
          numericCssValue(eventValue(event), unit),
          phase,
          event,
        );
      });
    }
    inputs.set(property, input);
    return input;
  };

  const createSizeInput = (property, label, prefix) => {
    if (!has(property)) return null;
    const input = document.createElement("fig-split-input");
    input.dataset.layoutProperty = property;
    input.style.cssText = "flex: 1 1 0; min-width: 0";
    input.setAttribute("type", "number");
    input.setAttribute("options", "Fixed,Fill,Relative");
    input.setAttribute("value", "0");
    input.setAttribute("aria-label", label);
    input.setAttribute("full", "");

    const state = { input, mode: "Relative", value: 0 };
    const syncChrome = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!input.isConnected) return;
          const numberInput = input.querySelector("fig-input-number");
          if (numberInput) {
            numberInput.setAttribute("min", "0");
            numberInput.setAttribute("steppers", "false");
            if (!numberInput.querySelector('[slot="prepend"]')) {
              const prepend = document.createElement("fig-icon");
              prepend.setAttribute("slot", "prepend");
              prepend.textContent = prefix;
              numberInput.append(prepend);
            }
          }
          input
            .querySelector("fig-select")
            ?.setAttribute("value", state.mode);
        });
      });
    };
    const cssValue = () => {
      if (state.mode === "Fill") return "100%";
      return numericCssValue(
        state.value,
        state.mode === "Relative" ? "%" : "px",
      );
    };
    for (const phase of ["input", "change"]) {
      input.addEventListener(phase, (event) => {
        const value = String(eventValue(event));
        if (["Fixed", "Fill", "Relative"].includes(value)) {
          state.mode = value;
          input.setAttribute("value", String(state.value));
        } else {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) state.value = Math.max(0, parsed);
        }
        syncChrome();
        emit(property, cssValue(), phase, event);
        emitConstrainedSize(property, phase, event);
      });
    }
    state.syncChrome = syncChrome;
    sizeInputs.set(property, state);
    syncChrome();
    return input;
  };

  const appendInputRow = (controls) => {
    const available = controls.filter(Boolean);
    if (available.length === 0) return null;
    const property = document.createElement("fig-property");
    const stack = document.createElement("fig-stack");
    stack.setAttribute("slot", "input");
    stack.setAttribute("full", "");
    stack.append(...available.map((control) => withControlTooltip(control)));
    property.append(stack);
    group.append(property);
    return property;
  };

  let modeControl = null;
  if (has("display")) {
    const property = document.createElement("fig-property");
    property.setAttribute("trailing", "space");
    property.setAttribute("show-trailing", "");
    modeControl = document.createElement("fig-segmented-control");
    modeControl.setAttribute("slot", "input");
    modeControl.setAttribute("sizing", "equal");
    modeControl.setAttribute("full", "");
    modeControl.setAttribute("aria-labelledby", title.id);

    for (const [mode, label] of [
      ["freeform", "Freeform"],
      ["horizontal", "Horizontal flex"],
      ["vertical", "Vertical flex"],
      ["grid", "Grid"],
    ]) {
      const segment = document.createElement("fig-segment");
      segment.setAttribute("value", mode);
      segment.setAttribute("aria-label", label);
      appendSvgIcon(segment, layoutModeIcon(mode));
      const tooltip = document.createElement("fig-tooltip");
      tooltip.setAttribute("text", label);
      tooltip.append(segment);
      modeControl.append(tooltip);
    }

    const emitMode = (phase, event) => {
      const mode = String(eventValue(event));
      const display =
        mode === "grid" ? "grid" : mode === "freeform" ? "block" : "flex";
      emit("display", display, phase, event);
      if (has("flex-direction") && mode === "vertical") {
        emit("flex-direction", "column", phase, event);
      } else if (has("flex-direction") && mode === "horizontal") {
        emit("flex-direction", "row", phase, event);
      }
    };
    modeControl.addEventListener("input", (event) => emitMode("input", event));
    modeControl.addEventListener("change", (event) =>
      emitMode("change", event),
    );
    property.append(modeControl);
    group.append(property);
  }

  const positionProperty = appendInputRow([
    createNumberInput("left", "X position", "X", "px"),
    createNumberInput("top", "Y position", "Y", "px"),
  ]);
  positionProperty?.setAttribute("trailing", "space");
  positionProperty?.setAttribute("show-trailing", "");
  const sizeProperty = appendInputRow([
    createSizeInput("width", "Width", "W"),
    createSizeInput("height", "Height", "H"),
  ]);

  if (has("aspect-ratio") && sizeProperty) {
    sizeProperty.setAttribute("show-trailing", "");
    aspectRatioButton = document.createElement("fig-button");
    aspectRatioButton.setAttribute("variant", "ghost");
    aspectRatioButton.setAttribute("type", "toggle");
    aspectRatioButton.setAttribute("icon", "");
    aspectRatioButton.setAttribute("slot", "trailing");
    aspectRatioButton.setAttribute("aria-label", "Constrain proportions");
    aspectRatioButton.setAttribute("title", "Constrain proportions");

    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.style.cssText =
      `display:block;width:24px;height:24px;flex:0 0 24px;background:currentColor;` +
      `-webkit-mask:url("${aspectRatioSquareIconUrl}") center/24px 24px no-repeat;` +
      `mask:url("${aspectRatioSquareIconUrl}") center/24px 24px no-repeat`;
    aspectRatioButton.append(icon);
    handleAspectRatioClick = (event) => {
      const selected = aspectRatioButton?.selected === true;
      emit(
        "aspect-ratio",
        selected ? calculatedAspectRatio() : "auto",
        "change",
        event,
      );
    };
    sizeProperty.append(aspectRatioButton);
  }

  let clipCheckbox = null;
  if (has("overflow")) {
    const property = document.createElement("fig-property");
    clipCheckbox = document.createElement("fig-checkbox");
    clipCheckbox.setAttribute("slot", "input");
    clipCheckbox.setAttribute("label", "Clip content");
    clipCheckbox.setAttribute("full", "");
    for (const phase of ["input", "change"]) {
      clipCheckbox.addEventListener(phase, (event) => {
        const checked =
          event instanceof CustomEvent &&
          event.detail &&
          typeof event.detail === "object"
            ? Boolean(event.detail.checked)
            : clipCheckbox.checked;
        emit(
          "overflow",
          checked ? "hidden" : "visible",
          phase,
          event,
        );
      });
    }
    property.append(withControlTooltip(clipCheckbox));
    group.append(property);
  }

  root.append(group);
  target.append(root);
  if (aspectRatioButton && handleAspectRatioClick) {
    aspectRatioButton.addEventListener("click", handleAspectRatioClick);
  }

  const sync = (values) => {
    for (const [property, input] of inputs) {
      const parsed = Number.parseFloat(String(values[property] ?? ""));
      input.setAttribute("value", String(Number.isFinite(parsed) ? parsed : 0));
    }
    for (const [property, state] of sizeInputs) {
      const value = String(values[property] ?? "");
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) state.value = parsed;
      if (value.endsWith("%")) {
        if (!(state.mode === "Fill" && parsed === 100)) {
          state.mode = "Relative";
        }
      } else if (value.endsWith("px")) {
        state.mode = "Fixed";
      }
      state.input.setAttribute("value", String(state.value));
      state.syncChrome();
    }
    if (modeControl) {
      const display = String(values.display ?? "block");
      const direction = String(values["flex-direction"] ?? "row");
      const mode =
        display === "grid" || display === "inline-grid"
          ? "grid"
          : display === "flex" || display === "inline-flex"
            ? direction.startsWith("column")
              ? "vertical"
              : "horizontal"
            : "freeform";
      modeControl.setAttribute("value", mode);
    }
    if (aspectRatioButton) {
      const aspectRatio = String(values["aspect-ratio"] ?? "auto").trim();
      aspectRatioButton.toggleAttribute(
        "selected",
        aspectRatio !== "" && aspectRatio !== "auto",
      );
    }
    if (clipCheckbox) {
      clipCheckbox.toggleAttribute(
        "checked",
        values.overflow === "hidden" || values.overflow === "clip",
      );
    }
  };
  const unsubscribe = kit.subscribe(sync);

  return {
    element: root,
    destroy() {
      unsubscribe();
      root.remove();
    },
  };
}

function mountTypographyModule(target, kit, emit, emitOptionHover) {
  const root = document.createElement("fig-module-typography");
  root.className = "fig-module";
  root.dataset.module = "typography";
  root.dataset.typographyModule = "";

  const group = document.createElement("fig-group");
  group.className = "text-properties-group";

  const has = (property) =>
    Object.prototype.hasOwnProperty.call(kit.values, property);
  const withTooltip = (text, child, slot) => {
    const tooltip = document.createElement("fig-tooltip");
    tooltip.setAttribute("text", text);
    if (slot) tooltip.setAttribute("slot", slot);
    tooltip.append(child);
    return tooltip;
  };
  const header = document.createElement("fig-header");
  header.setAttribute("borderless", "");
  const title = document.createElement("h3");
  title.textContent = "Typography";
  header.append(title);
  group.append(header);

  const appendProperty = (control) => {
    if (!control) return;
    const property = document.createElement("fig-property");
    control.setAttribute("slot", "input");
    control.setAttribute("full", "");
    property.append(
      withTooltip(control.getAttribute("label") || "Typography", control),
    );
    group.append(property);
  };

  const selects = new Map();
  const setSelectOptions = (select, options) => {
    let optionsPanel = select.querySelector(
      ":scope > fig-select-options",
    );
    if (!optionsPanel) {
      optionsPanel = document.createElement("fig-select-options");
      optionsPanel.setAttribute("slot", "panel");
      select.append(optionsPanel);
    }
    optionsPanel.replaceChildren(
      ...options.map(([value, optionLabel]) => {
        const option = document.createElement("fig-select-option");
        option.setAttribute("value", String(value));
        option.setAttribute("label", optionLabel);
        option.textContent = optionLabel;
        return option;
      }),
    );
  };
  const createSelect = (property, label, options) => {
    if (!has(property)) return null;
    const select = document.createElement("fig-select");
    select.setAttribute("label", label);
    setSelectOptions(select, options);
    select.addEventListener("input", (event) => {
      emit(property, String(eventValue(event)), "input", event);
    });
    select.addEventListener("change", (event) => {
      emit(property, String(eventValue(event)), "change", event);
    });
    select.addEventListener("optionhover", (event) => {
      emitOptionHover(property, String(eventValue(event)), event);
    });
    selects.set(property, select);
    return select;
  };

  const weightSelect = createSelect(
    "font-weight",
    "Font weight",
    FONT_WEIGHTS,
  );
  let fontPicker = null;
  let fontWeightOptionsKey = "";
  const availableFontWeights = () => {
    const family = fontPicker?.selectedFamily;
    if (!family) return FONT_WEIGHTS;
    const faces = Array.isArray(family.faces) ? family.faces : [];
    const weightAxis = faces
      .flatMap((face) => (Array.isArray(face.axes) ? face.axes : []))
      .find((axis) => axis.tag === "wght");
    if (weightAxis) {
      const options = FONT_WEIGHTS.filter(([value]) => {
        const weight = Number(value);
        return weight >= weightAxis.min && weight <= weightAxis.max;
      });
      if (options.length > 0) return options;
    }

    const weights = [
      ...new Set(
        faces
          .map((face) => Number(face.weight))
          .filter((weight) => Number.isFinite(weight)),
      ),
    ].sort((left, right) => left - right);
    const hasFaceMetadata =
      weights.length > 1 ||
      faces.some(
        (face) => face.src || face.fullName || face.postscriptName,
      );
    if (!hasFaceMetadata || weights.length === 0) return FONT_WEIGHTS;

    return weights.map((weight) => {
      const value = String(weight);
      const standardLabel = FONT_WEIGHTS.find(
        ([candidate]) => candidate === value,
      )?.[1];
      const faceLabel = faces.find(
        (face) => Number(face.weight) === weight,
      )?.style;
      return [
        value,
        standardLabel ||
          (/^(regular|italic|oblique)$/i.test(faceLabel || "")
            ? value
            : faceLabel || value),
      ];
    });
  };
  const syncFontWeightOptions = () => {
    if (!weightSelect) return;
    const options = availableFontWeights();
    const key = JSON.stringify(options);
    if (key === fontWeightOptionsKey) return;
    fontWeightOptionsKey = key;
    setSelectOptions(weightSelect, options);
  };
  if (has("font-family")) {
    const currentFamily = fontFamilyLabel(kit.values["font-family"]);
    fontPicker = document.createElement("fig-font-picker");
    fontPicker.setAttribute("label", "Font family");
    fontPicker.setAttribute("value", currentFamily);
    fontPicker.setAttribute(
      "options",
      JSON.stringify(
        [currentFamily, ...FONT_FAMILIES].filter(
          (value, index, values) => values.indexOf(value) === index,
        ),
      ),
    );
    fontPicker.addEventListener("input", (event) => {
      emit("font-family", fontPickerFamilyValue(event), "input", event);
      syncFontWeightOptions();
    });
    fontPicker.addEventListener("change", (event) => {
      emit("font-family", fontPickerFamilyValue(event), "change", event);
      syncFontWeightOptions();
    });
    fontPicker.addEventListener("fontmetadata", syncFontWeightOptions);
    fontPicker.addEventListener("optionhover", (event) => {
      emitOptionHover("font-family", fontPickerFamilyValue(event), event);
    });
    appendProperty(fontPicker);
  }

  const metricInputs = new Map();
  let syncFontSizeChrome = () => {};
  const fontWeightStack = document.createElement("fig-stack");
  fontWeightStack.setAttribute("slot", "input");
  fontWeightStack.setAttribute("full", "");
  const metricStack = document.createElement("fig-stack");
  metricStack.setAttribute("slot", "input");
  metricStack.setAttribute("full", "");
  const createMetric = (
    property,
    label,
    prefix,
    iconName,
    units,
    fallback,
    serialize,
    stack = metricStack,
  ) => {
    if (!has(property)) return;
    const input = document.createElement("fig-input-number");
    input.dataset.typographyProperty = property;
    input.style.cssText = "flex: 1 1 0; min-width: 0";
    if (property !== "font-size") input.setAttribute("aria-label", label);
    input.setAttribute("steppers", "false");
    input.setAttribute("units", units);
    if (property === "line-height") input.setAttribute("min", "0");
    if (iconName) {
      appendTypographyIcon(input, iconName, "prepend");
    } else {
      const prepend = document.createElement("fig-icon");
      prepend.setAttribute("slot", "prepend");
      prepend.textContent = prefix;
      input.append(prepend);
    }
    for (const phase of ["input", "change"]) {
      input.addEventListener(phase, (event) => {
        emit(
          property,
          serialize(property === "line-height" ? Math.max(0, Number(eventValue(event))) : Number(eventValue(event))),
          phase,
          event,
        );
      });
    }
    metricInputs.set(property, { input, fallback });
    stack.append(withTooltip(label, input));
  };
  if (weightSelect) {
    weightSelect.style.cssText = "flex: 1 1 0; min-width: 0";
    weightSelect.setAttribute("full", "");
    fontWeightStack.append(withTooltip("Font weight", weightSelect));
  }
  if (has("font-size")) {
    const fontSizeInput = document.createElement("fig-split-input");
    fontSizeInput.dataset.typographyProperty = "font-size";
    fontSizeInput.style.cssText = "flex: 1 1 0; min-width: 0";
    fontSizeInput.setAttribute("type", "number");
    fontSizeInput.setAttribute(
      "options",
      "10,11,12,13,14,15,16,20,24,32,36,40,48,64,96,128",
    );
    fontSizeInput.setAttribute("value", "16");
    fontSizeInput.setAttribute("aria-label", "Font size");
    fontSizeInput.setAttribute("full", "");
    syncFontSizeChrome = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const numberInput = fontSizeInput.querySelector("fig-input-number");
          numberInput?.setAttribute("steppers", "false");
          numberInput?.setAttribute("min", "0");
        });
      });
    };
    for (const phase of ["input", "change"]) {
      fontSizeInput.addEventListener(phase, (event) => {
        emit(
          "font-size",
          numericCssValue(Math.max(0, numericValue(eventValue(event))), "px"),
          phase,
          event,
        );
      });
    }
    metricInputs.set("font-size", { input: fontSizeInput, fallback: 16 });
    fontWeightStack.append(withTooltip("Font size", fontSizeInput));
    syncFontSizeChrome();
  }
  if (fontWeightStack.childElementCount > 0) {
    const property = document.createElement("fig-property");
    property.append(fontWeightStack);
    group.append(property);
  }
  createMetric(
    "line-height",
    "Line height",
    "",
    "text.line-height",
    "px",
    20,
    (value) => numericCssValue(value, "px"),
  );
  createMetric(
    "letter-spacing",
    "Letter spacing",
    "",
    "text.letter-spacing",
    "%",
    0,
    (value) => `${Number.isFinite(value) ? value / 100 : 0}em`,
  );
  if (metricStack.childElementCount > 0) {
    const property = document.createElement("fig-property");
    property.append(metricStack);
    group.append(property);
  }

  const alignmentStack = document.createElement("fig-stack");
  alignmentStack.setAttribute("slot", "input");
  alignmentStack.setAttribute("full", "");
  const alignments = new Map();
  const createAlignment = (property, label, values, vertical = false) => {
    if (!has(property)) return;
    const control = document.createElement("fig-segmented-control");
    control.style.cssText = "flex: 1 1 0; min-width: 0";
    control.setAttribute("sizing", "equal");
    control.setAttribute("aria-label", label);
    values.forEach(([value, optionLabel]) => {
      const segment = document.createElement("fig-segment");
      segment.setAttribute("value", value);
      segment.setAttribute("aria-label", optionLabel);
      segment.setAttribute("title", optionLabel);
      appendTypographyIcon(
        segment,
        `text.align-${vertical && value === "middle" ? "middle" : value}`,
      );
      control.append(withTooltip(optionLabel, segment));
    });
    for (const phase of ["input", "change"]) {
      control.addEventListener(phase, (event) => {
        emit(property, String(eventValue(event)), phase, event);
      });
    }
    alignments.set(property, control);
    alignmentStack.append(control);
  };
  createAlignment("text-align", "Text alignment", [
    ["left", "Align left"],
    ["center", "Align center"],
    ["right", "Align right"],
  ]);
  createAlignment(
    "vertical-align",
    "Vertical alignment",
    [
      ["top", "Align top"],
      ["middle", "Align middle"],
      ["bottom", "Align bottom"],
    ],
    true,
  );
  if (alignmentStack.childElementCount > 0) {
    const property = document.createElement("fig-property");
    property.append(alignmentStack);
    group.append(property);
  }

  root.append(group);
  target.append(root);

  const sync = (values) => {
    if (fontPicker) {
      fontPicker.value = fontFamilyLabel(values["font-family"]);
    }
    syncFontWeightOptions();
    for (const [property, select] of selects) {
      select.setAttribute("value", String(values[property] ?? ""));
    }
    for (const [property, { input, fallback }] of metricInputs) {
      const raw = String(values[property] ?? "");
      let value = numericValue(raw, fallback);
      if (property === "letter-spacing") {
        if (raw.endsWith("em")) value *= 100;
        else if (raw.endsWith("px")) {
          const fontSize = numericValue(values["font-size"], 16);
          value = fontSize > 0 ? value / fontSize * 100 : 0;
        }
      }
      input.setAttribute("value", String(value));
    }
    syncFontSizeChrome();
    for (const [property, control] of alignments) {
      let value = String(values[property] ?? "");
      if (property === "text-align") {
        if (value === "start") value = "left";
        if (value === "end") value = "right";
      }
      control.setAttribute("value", value);
    }
  };
  const unsubscribe = kit.subscribe(sync);

  return {
    element: root,
    destroy() {
      unsubscribe();
      root.remove();
    },
  };
}

function moduleLabel(property) {
  return property
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function moduleColorValue(event, control, opaque = false) {
  const detail = event instanceof CustomEvent ? event.detail : null;
  const value =
    (opaque ? detail?.hexOpaque : undefined) ??
    detail?.hex ??
    detail?.value ??
    control.value ??
    eventValue(event);
  return typeof value === "object"
    ? String(value?.hex ?? value?.value ?? "#000000")
    : String(value || "#000000");
}

function createModuleSelect(label, options, onValue) {
  const select = document.createElement("fig-select");
  select.setAttribute("label", label);
  select.setAttribute("full", "");
  select.style.cssText = "flex: 1 1 0; min-width: 0";
  const panel = document.createElement("fig-select-options");
  panel.setAttribute("slot", "panel");
  options.forEach(([value, optionLabel]) => {
    const option = document.createElement("fig-select-option");
    option.setAttribute("value", value);
    option.setAttribute("label", optionLabel);
    option.textContent = optionLabel;
    panel.append(option);
  });
  select.append(panel);
  for (const phase of ["input", "change"]) {
    select.addEventListener(phase, (event) => {
      onValue(String(eventValue(event)), phase, event);
    });
  }
  return select;
}

function createModuleNumber(label, units, onValue, options = {}) {
  const input = document.createElement("fig-input-number");
  input.setAttribute("aria-label", label);
  input.setAttribute("steppers", "false");
  input.setAttribute("step", String(options.step ?? 1));
  if (units) input.setAttribute("units", units);
  if (options.min !== undefined) input.setAttribute("min", String(options.min));
  if (options.max !== undefined) input.setAttribute("max", String(options.max));
  input.style.cssText = "flex: 1 1 0; min-width: 0";
  if (options.prependIcon) {
    const icon = appendSvgIcon(input, options.prependIcon);
    icon.setAttribute("slot", "prepend");
  }
  for (const phase of ["input", "change"]) {
    input.addEventListener(phase, (event) => {
      onValue(numericValue(eventValue(event)), phase, event);
    });
  }
  return input;
}

function createModuleText(label, onValue) {
  const input = document.createElement("fig-input-text");
  input.setAttribute("aria-label", label);
  input.setAttribute("full", "");
  input.style.cssText = "flex: 1 1 0; min-width: 0";
  for (const phase of ["input", "change"]) {
    input.addEventListener(phase, (event) => {
      onValue(String(eventValue(event)), phase, event);
    });
  }
  return input;
}

function createModuleColor(label, onValue, opaque = false) {
  const input = document.createElement("fig-input-color");
  input.setAttribute("aria-label", label);
  input.setAttribute("text", "true");
  input.setAttribute("full", "");
  input.style.cssText = "flex: 1 1 0; min-width: 0";
  for (const phase of ["input", "change"]) {
    input.addEventListener(phase, (event) => {
      onValue(moduleColorValue(event, input, opaque), phase, event);
    });
  }
  return input;
}

function appendModuleRow(group, controls, className = "") {
  const available = controls.filter(Boolean);
  if (!available.length) return null;
  const property = document.createElement("fig-property");
  if (className) property.className = className;
  const stack = document.createElement("fig-stack");
  stack.setAttribute("slot", "input");
  stack.setAttribute("full", "");
  stack.append(...available.map((control) => withControlTooltip(control)));
  property.append(stack);
  group.append(property);
  return property;
}

function createModuleAction(iconName, label, onClick) {
  const tooltip = document.createElement("fig-tooltip");
  tooltip.setAttribute("text", label);
  const button = document.createElement("fig-button");
  button.setAttribute("variant", "ghost");
  button.setAttribute("icon", "");
  button.setAttribute("aria-label", label);
  const icon = document.createElement("fig-icon");
  icon.setAttribute("name", iconName);
  icon.setAttribute("size", "small");
  button.append(icon);
  button.addEventListener("click", onClick);
  tooltip.append(button);
  return { tooltip, button, icon };
}

function createCompactModule(target, tagName, moduleId, title) {
  const root = document.createElement(tagName);
  root.className = "fig-module compact-line-module";
  root.dataset.module = moduleId;

  const group = document.createElement("fig-group");
  group.className = `${moduleId}-properties-group`;
  const header = document.createElement("fig-header");
  header.setAttribute("borderless", "");
  const heading = document.createElement("h3");
  heading.textContent = title;
  const actions = document.createElement("fig-stack");
  actions.setAttribute("direction", "horizontal");
  actions.className = "compact-line-module-actions";
  header.append(heading, actions);
  group.append(header);

  const advanced = document.createElement("fig-group");
  advanced.className = "compact-line-module-advanced";
  advanced.hidden = true;
  const advancedHeader = document.createElement("fig-header");
  advancedHeader.setAttribute("borderless", "");
  const advancedTitle = document.createElement("h3");
  advancedTitle.textContent = "Advanced";
  advancedHeader.append(advancedTitle);
  advanced.append(advancedHeader);

  root.append(group, advanced);
  target.append(root);
  return { root, group, header, actions, advanced };
}

function appendAdvancedTextControls(group, kit, emit, excluded) {
  const controls = new Map();
  for (const property of Object.keys(kit.values)) {
    if (excluded.has(property)) continue;
    const input = createModuleText(moduleLabel(property), (value, phase, event) =>
      emit(property, value, phase, event),
    );
    const field = document.createElement("fig-field");
    const label = document.createElement("label");
    label.textContent = moduleLabel(property);
    field.append(label, input);
    group.append(field);
    controls.set(property, input);
  }
  return (values) => {
    for (const [property, input] of controls) {
      input.setAttribute("value", String(values[property] ?? ""));
    }
  };
}

function setupCompactModuleActions(view, options) {
  let settings = null;
  if (options.advanced !== false) {
    settings = createModuleAction("settings", "Advanced settings", () => {
      const open = view.advanced.hidden;
      view.advanced.hidden = !open;
      settings.button.toggleAttribute("selected", open);
      settings.button.setAttribute(
        "aria-label",
        open ? "Hide advanced settings" : "Show advanced settings",
      );
    });
    view.actions.append(settings.tooltip);
  }
  const add = createModuleAction("add", `Add ${options.name}`, options.onAdd);
  view.actions.append(add.tooltip);

  const visibility = createModuleAction("visible", `Hide ${options.name}`, () =>
    options.onVisibility(),
  );
  visibility.icon.removeAttribute("size");
  const remove = createModuleAction("minus", `Remove ${options.name}`, () =>
    options.onRemove(),
  );
  return {
    add,
    settings,
    visibility,
    remove,
    syncVisibility(visible) {
      visibility.icon.setAttribute("name", visible ? "visible" : "hidden");
      visibility.button.toggleAttribute("selected", !visible);
      visibility.button.setAttribute(
        "aria-label",
        visible ? `Hide ${options.name}` : `Show ${options.name}`,
      );
      visibility.tooltip.setAttribute(
        "text",
        visible ? `Hide ${options.name}` : `Show ${options.name}`,
      );
    },
  };
}

function mountBorderModule(target, kit, emit) {
  const view = createCompactModule(
    target,
    "fig-module-border",
    "border",
    "Border",
  );
  view.advanced.remove();
  const state = { target: "all", lastStyle: "solid", widths: new Map() };
  const propertyFor = (part) =>
    state.target === "all"
      ? `border-${part}`
      : `border-${state.target}-${part}`;
  const has = (property) =>
    Object.prototype.hasOwnProperty.call(kit.values, property);

  let sync = () => {};
  const width = createModuleNumber(
    "Border width",
    "px",
    (value, phase, event) => {
      const property = propertyFor("width");
      if (has(property)) emit(property, `${value}px`, phase, event);
    },
    { min: 0, prependIcon: STROKE_WIDTH_ICON },
  );
  const style = createModuleSelect(
    "Border style",
    BORDER_STYLE_OPTIONS,
    (value, phase, event) => {
      const property = propertyFor("style");
      if (!has(property)) return;
      if (value !== "none") state.lastStyle = value;
      emit(property, value, phase, event);
    },
  );
  const targetSelect = createModuleSelect(
    "Border sides",
    BORDER_TARGET_OPTIONS,
    (value) => {
      state.target = value;
      sync(kit.values);
    },
  );
  const color = createModuleColor("Border color", (value, phase, event) => {
    const property = propertyFor("color");
    if (has(property)) emit(property, value, phase, event);
  });

  const actions = setupCompactModuleActions(view, {
    name: "border",
    advanced: false,
    onAdd(event) {
      emit(propertyFor("width"), "1px", "change", event);
      emit(propertyFor("style"), state.lastStyle || "solid", "change", event);
    },
    onVisibility(event) {
      const property = propertyFor("width");
      const current = String(kit.values[property] ?? "0px");
      const visible = hasVisibleWidth(current);
      if (visible) state.widths.set(state.target, current);
      emit(
        property,
        visible ? "0px" : state.widths.get(state.target) || "1px",
        "change",
        event,
      );
    },
    onRemove(event) {
      emit(propertyFor("width"), "0px", "change", event);
      emit(propertyFor("style"), "none", "change", event);
    },
  });
  const colorRow = appendModuleRow(
    view.group,
    [color],
    "compact-line-module-color",
  );
  colorRow.setAttribute("show-trailing", "");
  const colorActions = document.createElement("fig-stack");
  colorActions.setAttribute("slot", "trailing");
  colorActions.setAttribute("gap", "1");
  colorActions.append(
    actions.visibility.tooltip,
    actions.remove.tooltip,
  );
  colorRow.append(colorActions);
  const primaryRow = appendModuleRow(
    view.group,
    [width, style, targetSelect],
    "compact-line-module-primary",
  );

  sync = (values) => {
    for (const [target] of BORDER_TARGET_OPTIONS) {
      const property = target === "all" ? "border-width" : `border-${target}-width`;
      if (hasVisibleWidth(values[property])) state.widths.set(target, String(values[property]));
    }
    const widthProperty = propertyFor("width");
    const styleProperty = propertyFor("style");
    const colorProperty = propertyFor("color");
    width.setAttribute("value", String(numericValue(values[widthProperty], 1)));
    style.setAttribute("value", String(values[styleProperty] ?? "none"));
    targetSelect.setAttribute("value", state.target);
    color.setAttribute("value", String(values[colorProperty] ?? "#000000"));
    const hasBorder = String(values[styleProperty] ?? "none") !== "none";
    const visible = hasBorder && hasVisibleWidth(values[widthProperty]);
    if (hasBorder) state.lastStyle = String(values[styleProperty]);
    if (hasBorder) {
      if (colorRow.parentElement !== view.group) {
        view.group.append(colorRow, primaryRow);
      }
    } else {
      colorRow.remove();
      primaryRow.remove();
    }
    actions.add.button.toggleAttribute("hidden", hasBorder);
    actions.add.tooltip.toggleAttribute("hidden", hasBorder);
    actions.syncVisibility(visible);
  };
  const unsubscribe = kit.subscribe(sync);
  return {
    element: view.root,
    destroy() {
      unsubscribe();
      view.root.remove();
    },
  };
}

function strokeStyleForDasharray(value) {
  const text = String(value ?? "none").trim();
  if (!text || text === "none") return "solid";
  if (text === STROKE_DASHARRAY_BY_STYLE.dashed) return "dashed";
  if (text === STROKE_DASHARRAY_BY_STYLE.dotted) return "dotted";
  return "custom";
}

function hasVisibleWidth(value) {
  if (value === null || value === undefined || value === "") return false;
  return !String(value).trim().split(/\s+/).every((part) => Number.parseFloat(part) === 0);
}

function mountStrokeModule(target, kit, emit) {
  const view = createCompactModule(
    target,
    "fig-module-stroke",
    "stroke",
    "Stroke",
  );
  view.advanced.remove();
  const state = { lastColor: "#000000", lastWidth: "1px" };
  let sync = () => {};
  const width = createModuleNumber(
    "Stroke width",
    "px",
    (value, phase, event) => emit("stroke-width", `${value}px`, phase, event),
    { min: 0, prependIcon: STROKE_WIDTH_ICON },
  );
  const style = createModuleSelect(
    "Stroke style",
    STROKE_STYLE_OPTIONS,
    (value, phase, event) => {
      if (value === "custom") return;
      emit(
        "stroke-dasharray",
        STROKE_DASHARRAY_BY_STYLE[value],
        phase,
        event,
      );
    },
  );
  const color = createModuleColor("Stroke color", (value, phase, event) => {
    state.lastColor = value;
    emit("stroke", value, phase, event);
    const detail = event instanceof CustomEvent ? event.detail : null;
    const alpha = Number(detail?.rgba?.a);
    if (Number.isFinite(alpha)) {
      emit("stroke-opacity", Math.max(0, Math.min(1, alpha)), phase, event);
    }
  }, true);
  const linecap = createModuleSelect(
    "Line cap",
    [["butt", "Butt"], ["round", "Round"], ["square", "Square"]],
    (value, phase, event) => emit("stroke-linecap", value, phase, event),
  );
  const linejoin = createModuleSelect(
    "Line join",
    [["miter", "Miter"], ["round", "Round"], ["bevel", "Bevel"]],
    (value, phase, event) => emit("stroke-linejoin", value, phase, event),
  );
  const dasharray = createModuleText(
    "Stroke dash array",
    (value, phase, event) => emit("stroke-dasharray", value || "none", phase, event),
  );
  const dashoffset = createModuleNumber(
    "Stroke dash offset",
    "",
    (value, phase, event) => emit("stroke-dashoffset", String(value), phase, event),
  );

  const actions = setupCompactModuleActions(view, {
    name: "stroke",
    advanced: false,
    onAdd(event) {
      emit("stroke", state.lastColor, "change", event);
      emit("stroke-width", "1px", "change", event);
    },
    onVisibility(event) {
      const current = String(kit.values["stroke-width"] ?? "0px");
      const visible = hasVisibleWidth(current);
      if (visible) state.lastWidth = current;
      emit(
        "stroke-width",
        visible ? "0px" : state.lastWidth,
        "change",
        event,
      );
    },
    onRemove(event) {
      emit("stroke", "none", "change", event);
    },
  });
  const colorRow = appendModuleRow(
    view.group,
    [color],
    "compact-line-module-color",
  );
  colorRow.setAttribute("show-trailing", "");
  const colorActions = document.createElement("fig-stack");
  colorActions.setAttribute("slot", "trailing");
  colorActions.setAttribute("gap", "1");
  colorActions.append(
    actions.visibility.tooltip,
    actions.remove.tooltip,
  );
  colorRow.append(colorActions);
  const primaryRow = appendModuleRow(view.group, [
    width,
    style,
  ], "compact-line-module-primary");
  const dashRow = appendModuleRow(
    view.group,
    [dasharray, dashoffset],
    "compact-line-module-dash",
  );
  const lineRow = appendModuleRow(
    view.group,
    [linecap, linejoin],
    "compact-line-module-line",
  );
  sync = (values) => {
    const strokeColor = String(values.stroke ?? "none");
    if (strokeColor !== "none") state.lastColor = strokeColor;
    if (hasVisibleWidth(values["stroke-width"])) state.lastWidth = String(values["stroke-width"]);
    width.setAttribute("value", String(numericValue(values["stroke-width"], 1)));
    const strokeStyle = strokeStyleForDasharray(values["stroke-dasharray"]);
    style.setAttribute("value", strokeStyle);
    dashRow.hidden = strokeStyle !== "dashed" && strokeStyle !== "custom";
    const opacityValue = Number(values["stroke-opacity"] ?? 1);
    const opacity = Number.isFinite(opacityValue)
      ? Math.max(0, Math.min(1, opacityValue))
      : 1;
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, "0");
    color.setAttribute(
      "value",
      /^#[\da-f]{6}$/i.test(state.lastColor)
        ? `${state.lastColor}${alpha}`
        : state.lastColor,
    );
    linecap.setAttribute("value", String(values["stroke-linecap"] ?? "butt"));
    linejoin.setAttribute("value", String(values["stroke-linejoin"] ?? "miter"));
    dasharray.setAttribute(
      "value",
      String(values["stroke-dasharray"] ?? "none"),
    );
    dashoffset.setAttribute(
      "value",
      String(numericValue(values["stroke-dashoffset"], 0)),
    );
    const hasStroke = strokeColor !== "none";
    if (hasStroke) {
      if (colorRow.parentElement !== view.group) {
        view.group.append(colorRow, primaryRow, dashRow, lineRow);
      }
    } else {
      colorRow.remove();
      primaryRow.remove();
      dashRow.remove();
      lineRow.remove();
    }
    actions.add.button.toggleAttribute("hidden", hasStroke);
    actions.add.tooltip.toggleAttribute("hidden", hasStroke);
    actions.syncVisibility(hasStroke && hasVisibleWidth(values["stroke-width"]));
  };
  const unsubscribe = kit.subscribe(sync);
  return {
    element: view.root,
    destroy() {
      unsubscribe();
      view.root.remove();
    },
  };
}

function mountOutlineModule(target, kit, emit) {
  const view = createCompactModule(
    target,
    "fig-module-outline",
    "outline",
    "Outline",
  );
  view.advanced.remove();
  const state = {
    alignment: null,
    applyingPreset: false,
    lastStyle: "solid",
    offset: 0,
    width: 1,
  };
  const presetOffset = (alignment, width = state.width) => {
    if (alignment === "inside") return -width;
    if (alignment === "center") return -width / 2;
    return 0;
  };
  const alignmentForOffset = (offset, width) => {
    const epsilon = 0.0001;
    if (Math.abs(offset + width) < epsilon) return "inside";
    if (Math.abs(offset + width / 2) < epsilon) return "center";
    if (Math.abs(offset) < epsilon) return "outside";
    return "custom";
  };
  const emitPresetOffset = (alignment, phase, event, width = state.width) => {
    if (alignment === "custom") return;
    const offset = presetOffset(alignment, width);
    state.offset = offset;
    emit("outline-offset", `${offset}px`, phase, event);
  };
  const width = createModuleNumber(
    "Outline width",
    "px",
    (value, phase, event) => {
      const alignment = state.alignment ?? "outside";
      state.width = value;
      state.applyingPreset = alignment !== "custom";
      emit("outline-width", `${value}px`, phase, event);
      emitPresetOffset(alignment, phase, event, value);
      state.applyingPreset = false;
    },
    { min: 0, prependIcon: STROKE_WIDTH_ICON },
  );
  const style = createModuleSelect(
    "Outline style",
    OUTLINE_STYLE_OPTIONS,
    (value, phase, event) => {
      if (value !== "none") state.lastStyle = value;
      emit("outline-style", value, phase, event);
    },
  );
  let syncAlignmentControls = () => {};
  const alignment = createModuleSelect(
    "Outline alignment",
    OUTLINE_ALIGNMENT_OPTIONS,
    (value, phase, event) => {
      state.alignment = value;
      syncAlignmentControls();
      emitPresetOffset(value, phase, event);
    },
  );
  const customOffset = document.createElement("fig-split-input");
  customOffset.setAttribute("type", "number");
  customOffset.setAttribute(
    "options",
    OUTLINE_ALIGNMENT_OPTIONS.map(([, label]) => label).join(","),
  );
  customOffset.setAttribute("aria-label", "Outline offset");
  customOffset.setAttribute("full", "");
  customOffset.style.cssText = "flex: 1 1 0; min-width: 0";
  const syncCustomOffsetChrome = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!customOffset.isConnected) return;
        const input = customOffset.querySelector("fig-input-number");
        input?.setAttribute("steppers", "false");
        input?.setAttribute("units", "px");
        input?.setAttribute("aria-label", "Outline offset");
        const select = customOffset.querySelector("fig-select");
        const label = OUTLINE_ALIGNMENT_OPTIONS.find(
          ([value]) => value === state.alignment,
        )?.[1];
        if (select && label) select.setAttribute("value", label);
      });
    });
  };
  syncAlignmentControls = () => {
    const custom = state.alignment === "custom";
    alignment.hidden = custom;
    customOffset.hidden = !custom;
    alignment.setAttribute("value", state.alignment ?? "outside");
    customOffset.setAttribute("value", String(state.offset));
    syncCustomOffsetChrome();
  };
  for (const phase of ["input", "change"]) {
    customOffset.addEventListener(phase, (event) => {
      const rawValue = String(eventValue(event));
      const selectedAlignment = rawValue.toLowerCase();
      if (
        OUTLINE_ALIGNMENT_OPTIONS.some(
          ([value]) => value === selectedAlignment,
        )
      ) {
        state.alignment = selectedAlignment;
        syncAlignmentControls();
        emitPresetOffset(selectedAlignment, phase, event);
        return;
      }
      const value = numericValue(rawValue, state.offset);
      state.alignment = "custom";
      state.offset = value;
      syncCustomOffsetChrome();
      emit("outline-offset", `${value}px`, phase, event);
    });
  }
  const color = createModuleColor("Outline color", (value, phase, event) =>
    emit("outline-color", value, phase, event),
  );
  const actions = setupCompactModuleActions(view, {
    name: "outline",
    advanced: false,
    onAdd(event) {
      emit("outline-width", "1px", "change", event);
      emit("outline-style", state.lastStyle || "solid", "change", event);
      emit(
        "outline-color",
        String(kit.values["outline-color"] ?? DEFAULT_OUTLINE_COLOR),
        "change",
        event,
      );
    },
    onVisibility(event) {
      const current = String(kit.values["outline-style"] ?? "none");
      if (current !== "none") state.lastStyle = current;
      emit(
        "outline-style",
        current === "none" ? state.lastStyle || "solid" : "none",
        "change",
        event,
      );
    },
    onRemove(event) {
      emit("outline-width", "0px", "change", event);
      emit("outline-style", "none", "change", event);
    },
  });
  const colorRow = appendModuleRow(view.group, [
    color,
    actions.visibility.tooltip,
    actions.remove.tooltip,
  ], "compact-line-module-color");
  const primaryRow = appendModuleRow(view.group, [
    width,
    alignment,
    customOffset,
    style,
  ]);

  const sync = (values) => {
    const currentStyle = String(values["outline-style"] ?? "none");
    if (currentStyle !== "none") state.lastStyle = currentStyle;
    state.width = numericValue(values["outline-width"], 1);
    state.offset = numericValue(values["outline-offset"], 0);
    if (
      state.alignment === null ||
      (state.alignment !== "custom" && !state.applyingPreset)
    ) {
      state.alignment = alignmentForOffset(state.offset, state.width);
    }
    width.setAttribute(
      "value",
      String(state.width),
    );
    style.setAttribute(
      "value",
      currentStyle === "none" ? state.lastStyle : currentStyle,
    );
    syncAlignmentControls();
    color.setAttribute(
      "value",
      String(values["outline-color"] ?? DEFAULT_OUTLINE_COLOR),
    );
    const hasOutline =
      currentStyle !== "none" &&
      numericValue(values["outline-width"], 0) > 0;
    if (hasOutline) {
      if (colorRow.parentElement !== view.group) {
        view.group.append(colorRow, primaryRow);
      }
    } else {
      colorRow.remove();
      primaryRow.remove();
    }
    actions.add.button.toggleAttribute("hidden", hasOutline);
    actions.add.tooltip.toggleAttribute("hidden", hasOutline);
    actions.syncVisibility(currentStyle !== "none");
  };
  const unsubscribe = kit.subscribe(sync);
  return {
    element: view.root,
    destroy() {
      unsubscribe();
      view.root.remove();
    },
  };
}

function mountAppearanceModule(target, kit, emit, emitOptionHover) {
  const root = document.createElement("fig-module-appearance");
  root.className = "fig-module";
  root.dataset.module = "appearance";
  root.dataset.appearanceModule = "";

  const group = document.createElement("fig-group");
  group.className = "appearance-blending-group";

  const header = document.createElement("fig-header");
  header.setAttribute("borderless", "");
  const title = document.createElement("h3");
  title.textContent = "Appearance";
  header.append(title);

  const has = (property) =>
    Object.prototype.hasOwnProperty.call(kit.values, property);
  let visibilityButton = null;
  let visibilityTooltip = null;
  if (has("visibility")) {
    visibilityTooltip = document.createElement("fig-tooltip");
    visibilityButton = document.createElement("fig-button");
    visibilityButton.setAttribute("variant", "ghost");
    visibilityButton.setAttribute("type", "toggle");
    visibilityButton.setAttribute("icon", "");
    visibilityTooltip.append(visibilityButton);
    header.append(visibilityTooltip);
  }
  group.append(header);

  const property = document.createElement("fig-property");
  property.setAttribute("ratio", "1:1");
  const stack = document.createElement("fig-stack");
  stack.setAttribute("slot", "input");

  let opacityInput = null;
  if (has("opacity")) {
    opacityInput = document.createElement("fig-input-number");
    opacityInput.style.cssText = "flex: 1 1 0; min-width: 0";
    opacityInput.setAttribute("default", "100");
    opacityInput.setAttribute("min", "0");
    opacityInput.setAttribute("max", "100");
    opacityInput.setAttribute("step", "1");
    opacityInput.setAttribute("units", "%");
    opacityInput.setAttribute("steppers", "false");
    opacityInput.setAttribute("aria-label", "Opacity");
    opacityInput.addEventListener("input", (event) => {
      emit("opacity", Number(eventValue(event)) / 100, "input", event);
    });
    opacityInput.addEventListener("change", (event) => {
      emit("opacity", Number(eventValue(event)) / 100, "change", event);
    });
    const prepend = document.createElement("span");
    prepend.setAttribute("slot", "prepend");
    appendSvgIcon(prepend, OPACITY_ICON);
    opacityInput.append(prepend);
    stack.append(withControlTooltip(opacityInput));
  }

  let borderRadiusInput = null;
  let borderRadiusText = null;
  let borderRadiusTooltip = null;
  let borderRadiusUnit = "px";
  if (has("border-radius")) {
    borderRadiusInput = document.createElement("fig-input-number");
    borderRadiusInput.style.cssText = "flex: 1 1 0; min-width: 0";
    borderRadiusInput.setAttribute("default", "0");
    borderRadiusInput.setAttribute("min", "0");
    borderRadiusInput.setAttribute("step", "1");
    borderRadiusInput.setAttribute("units", "px");
    borderRadiusInput.setAttribute("steppers", "false");
    borderRadiusInput.setAttribute("aria-label", "Border radius");
    borderRadiusInput.addEventListener("input", (event) => {
      emit(
        "border-radius",
        `${Number(eventValue(event))}${borderRadiusUnit}`,
        "input",
        event,
      );
    });
    borderRadiusInput.addEventListener("change", (event) => {
      emit(
        "border-radius",
        `${Number(eventValue(event))}${borderRadiusUnit}`,
        "change",
        event,
      );
    });
    const prepend = document.createElement("span");
    prepend.setAttribute("slot", "prepend");
    appendSvgIcon(prepend, BORDER_RADIUS_ICON);
    borderRadiusInput.append(prepend);
    borderRadiusText = createModuleText("Border radius", (value, phase, event) => {
      if (CSS.supports("border-radius", value)) emit("border-radius", value, phase, event);
      else if (phase === "change") borderRadiusText.value = kit.values["border-radius"];
    });
    borderRadiusTooltip = withControlTooltip(borderRadiusInput);
    stack.append(borderRadiusTooltip);
  }

  let blendSelect = null;
  let blendProperty = null;
  if (has("mix-blend-mode")) {
    blendProperty = document.createElement("fig-property");
    blendProperty.setAttribute("ratio", "1:1");
    const blendStack = document.createElement("fig-stack");
    blendStack.setAttribute("slot", "input");
    blendStack.setAttribute("full", "");

    blendSelect = document.createElement("fig-select");
    blendSelect.setAttribute("full", "");
    blendSelect.setAttribute("label", "Blend mode");
    blendSelect.addEventListener("input", (event) => {
      emit("mix-blend-mode", String(eventValue(event)), "input", event);
    });
    blendSelect.addEventListener("change", (event) => {
      emit("mix-blend-mode", String(eventValue(event)), "change", event);
    });
    blendSelect.addEventListener("optionhover", (event) => {
      emitOptionHover(
        "mix-blend-mode",
        String(eventValue(event)),
        event,
      );
    });
    const prependIcon = appendSvgIcon(blendSelect, BLEND_MODE_ICON);
    prependIcon.setAttribute("slot", "prepend-trigger");

    const options = document.createElement("fig-select-options");
    options.setAttribute("slot", "panel");
    supportedBlendModeGroups().forEach((modes, groupIndex) => {
      if (groupIndex > 0) options.append(document.createElement("fig-separator"));
      modes.forEach((mode) => {
        const option = document.createElement("fig-select-option");
        const label = blendModeLabel(mode);
        option.setAttribute("value", mode);
        option.setAttribute("label", label);
        option.textContent = label;
        options.append(option);
      });
    });
    blendSelect.append(options);
    blendStack.append(withControlTooltip(blendSelect));
    blendProperty.append(blendStack);
  }

  property.append(stack);
  group.append(property);
  if (blendProperty) group.append(blendProperty);
  root.append(group);
  target.append(root);
  visibilityButton?.addEventListener("click", (event) => {
    const next = visibilityButton.selected ? "hidden" : "visible";
    emit("visibility", next, "change", event);
  });

  const sync = (values) => {
    if (visibilityButton && visibilityTooltip) {
      const visible = values.visibility === "visible";
      visibilityButton.toggleAttribute("selected", !visible);
      visibilityButton.setAttribute(
        "aria-label",
        visible ? "Hide element" : "Show element",
      );
      visibilityTooltip.setAttribute(
        "text",
        visible ? "Hide element" : "Show element",
      );
      visibilityButton.replaceChildren();
      const icon = document.createElement("fig-icon");
      icon.setAttribute("name", visible ? "visible" : "hidden");
      visibilityButton.append(icon);
    }
    if (opacityInput) {
      opacityInput.setAttribute(
        "value",
        String(Number((Number(values.opacity ?? 1) * 100).toFixed(10))),
      );
    }
    if (borderRadiusInput) {
      const rawRadius = String(values["border-radius"] ?? "0px");
      const scalar = rawRadius.trim().match(/^([\d.]+)([a-z%]*)$/i);
      const control = scalar ? borderRadiusInput : borderRadiusText;
      if (borderRadiusTooltip.firstElementChild !== control) {
        borderRadiusTooltip.replaceChildren(control);
      }
      borderRadiusUnit = scalar?.[2] || "px";
      borderRadiusInput.setAttribute("units", borderRadiusUnit);
      borderRadiusInput.setAttribute(
        "value",
        String(numericValue(values["border-radius"], 0)),
      );
      borderRadiusText.setAttribute("value", rawRadius);
    }
    if (blendSelect) {
      blendSelect.setAttribute(
        "value",
        String(values["mix-blend-mode"] ?? "normal"),
      );
    }
  };
  const unsubscribe = kit.subscribe(sync);

  return {
    element: root,
    destroy() {
      unsubscribe();
      root.remove();
    },
  };
}

const MODULE_PRESENTATIONS = {
  layout: {
    properties: LAYOUT_PROPERTIES,
    transitionProperties: ["flex-direction"],
    mount: mountLayoutModule,
    serializeValues(values) {
      const display = String(values.display ?? "block");
      if (display === "flex" || display === "inline-flex") return values;
      const serialized = { ...values };
      delete serialized["flex-direction"];
      return serialized;
    },
  },
  typography: {
    properties: TYPOGRAPHY_PROPERTIES,
    mount: mountTypographyModule,
  },
  appearance: {
    properties: APPEARANCE_PROPERTIES,
    mount: mountAppearanceModule,
  },
  border: {
    properties: BORDER_PROPERTIES,
    mount: mountBorderModule,
  },
  stroke: {
    properties: STROKE_PROPERTIES,
    mount: mountStrokeModule,
  },
  outline: {
    properties: OUTLINE_PROPERTIES,
    mount: mountOutlineModule,
    serializeValues(values) {
      return values["outline-style"] === "none"
        ? { outline: "none" }
        : values;
    },
    serializeChange(change) {
      return change.path === "outline-style" && change.value === "none"
        ? {
            ...change,
            path: "outline",
            value: "none",
            previousValue: undefined,
          }
        : change;
    },
  },
};

export function figCreateModule(moduleId, options = {}) {
  const result = createCssModuleConfig(moduleId, {
    element: options.element,
    values: options.values,
  });
  const presentation = MODULE_PRESENTATIONS[moduleId];
  const transitionProperties = new Set(
    presentation?.transitionProperties ?? [],
  );
  const unconstrainedConfig =
    transitionProperties.size > 0
      ? createCssModuleConfig(moduleId).config
      : null;
  const config = presentation?.properties
    ? Object.fromEntries(
        presentation.properties
          .map((property) => [
            property,
            Object.prototype.hasOwnProperty.call(result.config, property)
              ? result.config[property]
              : transitionProperties.has(property)
                ? unconstrainedConfig?.[property]
                : undefined,
          ])
          .filter(([, definition]) => definition !== undefined),
      )
    : result.config;
  const serializeValues = (values) =>
    presentation?.serializeValues?.(values) ?? values;
  const serializeChange = (change) =>
    presentation?.serializeChange?.(change) ?? change;
  if (moduleId === "border") {
    const initial = Object.fromEntries(Object.entries(config).map(([property, definition]) => [property, definition.default]));
    for (const [property, value] of Object.entries(borderValuesPatch(initial, options.values ?? {}))) {
      config[property] = { ...config[property], default: value };
    }
  }
  const kit = figCreateProps(result.module.label, config, {
    id: options.id,
    onInput: options.onInput,
    onChange: options.onChange,
    onOptionHover: options.onOptionHover,
  });

  let view = null;
  const setModuleValues = (values) => kit.setValues(
    moduleId === "border" ? borderValuesPatch(kit.getValues(), values) : values,
  );
  const setModuleValue = (path, value) => {
    if (moduleId === "border") setModuleValues({ [path]: value });
    else kit.setValue(path, value);
  };
  let destroyed = false;
  const unmount = () => {
    view?.destroy();
    view = null;
  };
  const emit = (path, value, phase, sourceEvent) => {
    if (destroyed) return;
    const previousValue = kit.getValues()[path];
    setModuleValue(path, value);
    const callback =
      phase === "input" ? options.onInput : options.onChange;
    const change = serializeChange({
      path,
      value,
      previousValue,
      phase,
      panelId: kit.id,
      sourceEvent,
    });
    callback?.(change.path, change.value, change);
  };
  const emitOptionHover = (path, value, sourceEvent) => {
    if (destroyed) return;
    options.onOptionHover?.(path, value, {
      path,
      value,
      panelId: kit.id,
      sourceEvent,
    });
  };

  const controller = {
    id: kit.id,
    module: result.module,
    get element() {
      return view?.element ?? null;
    },
    get values() {
      return serializeValues(kit.values);
    },
    getValues() {
      return serializeValues(kit.getValues());
    },
    setValue: setModuleValue,
    setValues: setModuleValues,
    resetValues: kit.resetValues,
    subscribe(listener, options = true) {
      const changes =
        typeof options === "object" && options.mode === "changes";
      return kit.subscribe(
        changes
          ? (records) => listener(records.map(serializeChange))
          : (values) => listener(serializeValues(values)),
        options,
      );
    },
    mount(target) {
      if (destroyed) {
        throw new Error("Cannot mount a destroyed module.");
      }
      const resolvedTarget = resolveTarget(target);
      unmount();
      view = presentation
        ? presentation.mount(
            resolvedTarget,
            kit,
            emit,
            emitOptionHover,
          )
        : figCreatePropsRoot({
            target: resolvedTarget,
            panelIds: [kit.id],
          });
      return controller;
    },
    unmount,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unmount();
      kit.destroy();
    },
  };

  return controller;
}
