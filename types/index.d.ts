import type {
  FigHTMLElement,
  FigSliderDetail,
  FigValueDetail,
  FigValueElement,
} from "@rogieking/figui3";

export * from "@rogieking/figui3";

export interface FigReorderDetail {
  from: number;
  to: number;
  item?: Element;
}

export interface FigInputSliderState {
  values: number[];
  min: number;
  max: number;
  step: number;
  activeHandleIndex?: number;
}

export interface FigInputSliderElement
  extends FigValueElement<string, FigSliderDetail<string>> {
  defaultValue: string;
  readonly isDefault: boolean;
  occlusionTargets: Element[];
  getSliderState(): FigInputSliderState;
  setInteractionValue(
    value: number,
    options?: Record<string, unknown>,
  ): boolean;
  commitInteractionChange(handleIndex?: number): void;
  requestRender(): void;
  resetToDefault(): void;
}

export interface FigInputWheelElement
  extends FigValueElement<string, FigSliderDetail<string>> {
  spinTo(value: number): void;
  beginScrub(event?: PointerEvent): void;
  updateScrub(value: number, event?: PointerEvent): void;
  endScrub(commit?: boolean): void;
  resetToDefault(): void;
}

export interface FigSelectElement
  extends FigValueElement<string, FigValueDetail<string>> {
  open?: boolean;
  menuAnchor?: Element | null;
}

export interface FigFontAxis {
  tag: string;
  name: string;
  min: number;
  default: number;
  max: number;
}

export interface FigFontInstance {
  id: string;
  name: string;
  coordinates: Record<string, number>;
}

export interface FigFontFace {
  id: string;
  family?: string;
  style: string;
  weight: number;
  stretch?: number;
  fullName?: string;
  postscriptName?: string;
  src?: string;
  provider?: string;
  axes?: FigFontAxis[];
  instances?: FigFontInstance[];
}

export interface FigFontFamily {
  family: string;
  label?: string;
  category?: string;
  source?: "provided" | "local" | "web" | "google" | "generic" | string;
  sources?: string[];
  provider?: string;
  popularity?: number;
  subsets?: string[];
  tags?: string[];
  roles?: Array<"body" | "headline" | "display" | "code">;
  previewUrl?: string;
  faces?: FigFontFace[];
}

export interface FigFontPickerValue {
  family: string;
  face?: Omit<FigFontFace, "family" | "src" | "axes" | "instances">;
  axes: Record<string, number>;
}

export interface FigFontPickerCss {
  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  fontStretch: string;
  fontOpticalSizing: string;
  fontVariationSettings: string;
}

export interface FigFontResource {
  provider: string;
  family: string;
  category?: string;
  popularity?: number;
  face: Pick<FigFontFace, "id" | "style" | "weight"> | null;
  axes: Record<string, number>;
  stylesheetUrl?: string;
  fontUrl?: string;
}

export interface FigFontPickerResult extends FigFontPickerValue {
  resource: FigFontResource | null;
}

export interface FigFontPickerElement extends FigHTMLElement {
  get value(): FigFontPickerValue;
  set value(value: string | FigFontPickerValue);
  readonly defaultValue: FigFontPickerValue;
  readonly isDefault: boolean;
  options: Array<string | FigFontFamily>;
  readonly fonts: FigFontFamily[];
  readonly selectedFace: FigFontFace | null;
  readonly selectedFamily: FigFontFamily | null;
  readonly selectedResource: FigFontResource | null;
  readonly result: FigFontPickerResult;
  readonly cssValue: FigFontPickerCss;
  minimal: boolean;
  localFonts: boolean;
  googleFonts: boolean;
  googleFontLimit: number;
  favorites: string[];
  dialogPosition: string;
  dialogOffset: string;
  anchorElement: Element | null;
  open(): void;
  close(): void;
  focus(options?: FocusOptions): void;
  resetToDefault(): void;
  inspectSelectedFace(): Promise<FigFontFace | null>;
  refreshFonts(options?: { requestLocal?: boolean }): Promise<FigFontFamily[]>;
}

export interface FigFillPickerElement extends FigValueElement {
  anchorElement?: Element | null;
  activate?(options?: Record<string, unknown>): void;
}

export interface FigFill {
  type: "solid" | "gradient" | "image" | string;
  visible?: boolean;
  color?: string;
  opacity?: number;
  gradient?: Record<string, unknown>;
  image?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface FigModuleFillsElement extends FigHTMLElement {
  fills: FigFill[] | string;
  readonly values: Record<string, string | number>;
  multiple: boolean;
  readonly valueProperty: string;
}

export type FigFillModuleElement = FigModuleFillsElement;

export interface FigFilter {
  type: string;
  primitive?: string;
  visible?: boolean;
  [key: string]: unknown;
}

export interface FigModuleFiltersElement extends FigHTMLElement {
  filters: FigFilter[] | string;
  readonly values: Record<string, string>;
  multiple: boolean;
}

export type FigFilterModuleElement = FigModuleFiltersElement;

export interface FigShadow {
  type: "drop" | "inner" | "text" | string;
  x?: number;
  y?: number;
  blur?: number;
  spread?: number;
  color?: string;
  visible?: boolean;
  [key: string]: unknown;
}

export interface FigModuleShadowsElement extends FigHTMLElement {
  shadows: FigShadow[] | string;
  readonly values: Record<"box-shadow" | "text-shadow", string>;
  multiple: boolean;
}

export type FigShadowModuleElement = FigModuleShadowsElement;

export interface FigTransform {
  type: "translate" | "rotate" | "scale" | "skew" | "perspective" | string;
  x?: number;
  y?: number;
  z?: number;
  depth?: number;
  visible?: boolean;
  [key: string]: unknown;
}

export interface FigModuleTransformsElement extends FigHTMLElement {
  transforms: FigTransform[] | string;
  readonly values: Record<"transform", string>;
  multiple: boolean;
}

export type FigTransformModuleElement = FigModuleTransformsElement;

export interface FigModuleAppearanceElement extends FigHTMLElement {}
export interface FigModuleTypographyElement extends FigHTMLElement {}
export interface FigModuleBorderElement extends FigHTMLElement {}
export interface FigModuleStrokeElement extends FigHTMLElement {}
export interface FigModuleOutlineElement extends FigHTMLElement {}

export interface FigExtendedTagNameMap {
  "fig-ai-context": FigHTMLElement;
  "fig-ai-prompt": FigHTMLElement;
  "fig-attachment": FigHTMLElement;
  "fig-attachments": FigHTMLElement;
  "fig-canvas-control": FigValueElement;
  "fig-chat-message": FigHTMLElement;
  "fig-module-appearance": FigModuleAppearanceElement;
  "fig-module-border": FigModuleBorderElement;
  "fig-module-fills": FigModuleFillsElement;
  "fig-module-filters": FigModuleFiltersElement;
  "fig-module-outline": FigModuleOutlineElement;
  "fig-module-shadows": FigModuleShadowsElement;
  "fig-module-stroke": FigModuleStrokeElement;
  "fig-module-typography": FigModuleTypographyElement;
  "fig-module-transforms": FigModuleTransformsElement;
  "fig-font-picker": FigFontPickerElement;
  "fig-fill-picker": FigFillPickerElement;
  "fig-gradient-editor": FigValueElement;
  "fig-input-point": FigValueElement;
  "fig-input-rotate": FigValueElement;
  "fig-input-slider": FigInputSliderElement;
  "fig-input-slider-delta": FigInputSliderElement;
  "fig-input-slider-hue": FigInputSliderElement;
  "fig-input-slider-opacity": FigInputSliderElement;
  "fig-input-slider-stepper": FigInputSliderElement;
  "fig-input-slider-wheel": FigInputSliderElement;
  "fig-input-wheel": FigInputWheelElement;
  "fig-interpolation-swatch": FigValueElement;
  "fig-palette-editor": FigValueElement;
  "fig-reorder": FigValueElement;
  "fig-select": FigSelectElement;
  "fig-select-option": FigValueElement;
  "fig-select-options": FigHTMLElement;
}

declare module "@rogieking/figui3" {
  interface FigTagNameMap extends FigExtendedTagNameMap {}
}
