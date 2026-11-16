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

export interface FigFillPickerElement extends FigValueElement {
  anchorElement?: Element | null;
  activate?(options?: Record<string, unknown>): void;
}

export interface FigExtendedTagNameMap {
  "fig-ai-context": FigHTMLElement;
  "fig-ai-prompt": FigHTMLElement;
  "fig-attachment": FigHTMLElement;
  "fig-attachments": FigHTMLElement;
  "fig-canvas-control": FigValueElement;
  "fig-chat-message": FigHTMLElement;
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
