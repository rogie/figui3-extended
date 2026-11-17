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
  "mix-blend-mode",
];

const LAYOUT_PROPERTIES = [
  "left",
  "top",
  "width",
  "height",
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
  return String(value || "sans-serif")
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

function mountLayoutModule(target, kit, emit) {
  const root = document.createElement("div");
  root.className = "propskit-root propskit-module-root";
  root.dataset.module = "layout";
  root.dataset.layoutModule = "";

  const panel = document.createElement("div");
  panel.className = "propskit-panel prop-panel";
  const group = document.createElement("fig-group");
  group.setAttribute("compact", "");
  group.className = "layout-properties-group";

  const header = document.createElement("fig-header");
  header.setAttribute("borderless", "");
  const title = document.createElement("h3");
  title.textContent = "Layout";
  header.append(title);
  group.append(header);

  const has = (property) =>
    Object.prototype.hasOwnProperty.call(kit.values, property);
  const inputs = new Map();
  const sizeInputs = new Map();

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
          if (Number.isFinite(parsed)) state.value = parsed;
        }
        syncChrome();
        emit(property, cssValue(), phase, event);
      });
    }
    state.syncChrome = syncChrome;
    sizeInputs.set(property, state);
    syncChrome();
    return input;
  };

  const appendInputRow = (controls) => {
    const available = controls.filter(Boolean);
    if (available.length === 0) return;
    const property = document.createElement("fig-property");
    const stack = document.createElement("fig-stack");
    stack.setAttribute("slot", "input");
    stack.setAttribute("full", "");
    stack.append(...available);
    property.append(stack);
    group.append(property);
  };

  let modeControl = null;
  if (has("display")) {
    const property = document.createElement("fig-property");
    modeControl = document.createElement("fig-segmented-control");
    modeControl.setAttribute("slot", "input");
    modeControl.setAttribute("sizing", "equal");
    modeControl.setAttribute("full", "");
    modeControl.setAttribute("aria-label", "Layout mode");

    for (const [mode, label] of [
      ["freeform", "Freeform"],
      ["vertical", "Vertical flex"],
      ["horizontal", "Horizontal flex"],
      ["grid", "Grid"],
    ]) {
      const segment = document.createElement("fig-segment");
      segment.setAttribute("value", mode);
      segment.setAttribute("aria-label", label);
      segment.setAttribute("title", label);
      appendSvgIcon(segment, layoutModeIcon(mode));
      modeControl.append(segment);
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

  appendInputRow([
    createNumberInput("left", "X position", "X", "px"),
    createNumberInput("top", "Y position", "Y", "px"),
  ]);
  appendInputRow([
    createSizeInput("width", "Width", "W"),
    createSizeInput("height", "Height", "H"),
  ]);

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
    property.append(clipCheckbox);
    group.append(property);
  }

  panel.append(group);
  root.append(panel);
  target.append(root);

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
  root.className = "propskit-root propskit-module-root";
  root.dataset.module = "typography";
  root.dataset.typographyModule = "";

  const panel = document.createElement("div");
  panel.className = "propskit-panel prop-panel";
  const group = document.createElement("fig-group");
  group.setAttribute("compact", "");
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
  const createSelect = (property, label, options) => {
    if (!has(property)) return null;
    const select = document.createElement("fig-select");
    select.setAttribute("label", label);
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

  let fontPicker = null;
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
    });
    fontPicker.addEventListener("change", (event) => {
      emit("font-family", fontPickerFamilyValue(event), "change", event);
    });
    fontPicker.addEventListener("optionhover", (event) => {
      emitOptionHover("font-family", fontPickerFamilyValue(event), event);
    });
    appendProperty(fontPicker);
  }
  appendProperty(
    createSelect("font-weight", "Font weight", FONT_WEIGHTS),
  );

  const metricInputs = new Map();
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
  ) => {
    if (!has(property)) return;
    const input = document.createElement("fig-input-number");
    input.style.cssText = "flex: 1 1 0; min-width: 0";
    input.setAttribute("aria-label", label);
    input.setAttribute("steppers", "false");
    input.setAttribute("units", units);
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
          serialize(Number(eventValue(event))),
          phase,
          event,
        );
      });
    }
    metricInputs.set(property, { input, fallback });
    metricStack.append(withTooltip(label, input));
  };
  createMetric("font-size", "Font size", "↕A", null, "px", 16, (value) =>
    numericCssValue(value, "px"),
  );
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

  panel.append(group);
  root.append(panel);
  target.append(root);

  const sync = (values) => {
    for (const [property, select] of selects) {
      select.setAttribute("value", String(values[property] ?? ""));
    }
    if (fontPicker) {
      fontPicker.value = fontFamilyLabel(values["font-family"]);
    }
    for (const [property, { input, fallback }] of metricInputs) {
      const raw = String(values[property] ?? "");
      const value =
        property === "letter-spacing" && raw.endsWith("em")
          ? numericValue(raw, fallback) * 100
          : numericValue(raw, fallback);
      input.setAttribute("value", String(value));
    }
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

function mountAppearanceModule(target, kit, emit, emitOptionHover) {
  const root = document.createElement("fig-module-appearance");
  root.className = "propskit-root propskit-module-root";
  root.dataset.module = "appearance";
  root.dataset.appearanceModule = "";

  const panel = document.createElement("div");
  panel.className = "propskit-panel prop-panel";
  const group = document.createElement("fig-group");
  group.setAttribute("compact", "");
  group.className = "appearance-blending-group";

  const header = document.createElement("fig-header");
  header.setAttribute("borderless", "");
  const title = document.createElement("h3");
  title.textContent = "Blending";
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
    visibilityButton.addEventListener("click", (event) => {
      const next =
        kit.values.visibility === "visible" ? "hidden" : "visible";
      emit("visibility", next, "change", event);
    });
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
    stack.append(opacityInput);
  }

  let blendSelect = null;
  if (has("mix-blend-mode")) {
    blendSelect = document.createElement("fig-select");
    blendSelect.style.cssText = "flex: 1 1 0; min-width: 0";
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
    stack.append(blendSelect);
  }

  property.append(stack);
  group.append(property);
  panel.append(group);
  root.append(panel);
  target.append(root);

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
      icon.setAttribute("size", "small");
      visibilityButton.append(icon);
    }
    if (opacityInput) {
      opacityInput.setAttribute(
        "value",
        String(Math.round(Number(values.opacity ?? 1) * 100)),
      );
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
    mount: mountLayoutModule,
  },
  typography: {
    properties: TYPOGRAPHY_PROPERTIES,
    mount: mountTypographyModule,
  },
  appearance: {
    properties: APPEARANCE_PROPERTIES,
    mount: mountAppearanceModule,
  },
};

export function figCreateModule(moduleId, options = {}) {
  const result = createCssModuleConfig(moduleId, {
    element: options.element,
    values: options.values,
  });
  const presentation = MODULE_PRESENTATIONS[moduleId];
  const config = presentation
    ? Object.fromEntries(
        presentation.properties
          .filter((property) =>
            Object.prototype.hasOwnProperty.call(result.config, property),
          )
          .map((property) => [property, result.config[property]]),
      )
    : result.config;
  const kit = figCreateProps(result.module.label, config, {
    id: options.id,
    onInput: options.onInput,
    onChange: options.onChange,
    onOptionHover: options.onOptionHover,
  });

  let view = null;
  let destroyed = false;
  const unmount = () => {
    view?.destroy();
    view = null;
  };
  const emit = (path, value, phase, sourceEvent) => {
    if (destroyed) return;
    const previousValue = kit.getValues()[path];
    kit.setValue(path, value);
    const callback =
      phase === "input" ? options.onInput : options.onChange;
    callback?.(path, value, {
      path,
      value,
      previousValue,
      phase,
      panelId: kit.id,
      sourceEvent,
    });
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
      return kit.values;
    },
    getValues: kit.getValues,
    setValue: kit.setValue,
    setValues: kit.setValues,
    resetValues: kit.resetValues,
    subscribe: kit.subscribe,
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
