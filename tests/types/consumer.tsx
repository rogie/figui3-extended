import "@rogieking/figui3/react";
import "@rogieking/figui3-extended/react";
import "@rogieking/figui3-extended/fig-editor.js";
import "@rogieking/figui3-extended/fig-lab.js";
import type {
  FigInputSliderElement,
  FigReorderDetail,
} from "@rogieking/figui3-extended";

const slider: FigInputSliderElement =
  document.querySelector("fig-input-slider")!;
slider.resetToDefault();

const detail: FigReorderDetail = { from: 0, to: 1 };
void detail;

export const controls = (
  <>
    <fig-fill-picker value="#ff0000" />
    <fig-input-rotate value="0,0,0" />
    <fig-input-slider value="50" />
    <fig-canvas-control />
  </>
);
