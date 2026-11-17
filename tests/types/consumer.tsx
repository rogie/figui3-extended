import "@rogieking/figui3/react";
import "@rogieking/figui3-extended/react";
import "@rogieking/figui3-extended/fig-editor.js";
import "@rogieking/figui3-extended/fig-lab.js";
import {
  analyzeElementStyleCapabilities,
  createCssModuleConfig,
  figCreateModule,
  getElementStyleCapability,
} from "@rogieking/figui3-extended/css-properties.js";
import type {
  FigFontPickerElement,
  FigFontPickerValue,
  FigModuleFiltersElement,
  FigModuleFillsElement,
  FigModuleShadowsElement,
  FigModuleTransformsElement,
  FigInputSliderElement,
  FigReorderDetail,
} from "@rogieking/figui3-extended";

const fontPicker: FigFontPickerElement =
  document.querySelector("fig-font-picker")!;
const fontValue: FigFontPickerValue = {
  family: "Inter",
  axes: { wght: 500 },
};
fontPicker.value = fontValue;
void fontPicker.cssValue;
void fontPicker.selectedResource;

const slider: FigInputSliderElement =
  document.querySelector("fig-input-slider")!;
slider.resetToDefault();

const fillModule: FigModuleFillsElement =
  document.querySelector("fig-module-fills")!;
fillModule.fills = [{ type: "solid", color: "#ff0000", visible: true }];
void fillModule.values;

const filterModule: FigModuleFiltersElement =
  document.querySelector("fig-module-filters")!;
filterModule.filters = [
  { type: "gaussian-blur", radius: 4, visible: true },
];
void filterModule.values;

const shadowModule: FigModuleShadowsElement =
  document.querySelector("fig-module-shadows")!;
shadowModule.shadows = [
  {
    type: "drop",
    x: 0,
    y: 4,
    blur: 4,
    spread: 0,
    color: "#00000040",
    visible: true,
  },
];
void shadowModule.values;

const transformModule: FigModuleTransformsElement =
  document.querySelector("fig-module-transforms")!;
transformModule.transforms = [
  { type: "translate", x: 0, y: 0, z: 0, visible: true },
];
void transformModule.values;

const detail: FigReorderDetail = { from: 0, to: 1 };
void detail;

const element = document.querySelector("div")!;
const capabilities = analyzeElementStyleCapabilities(element);
const widthCapability = getElementStyleCapability(element, "width");
const layoutConfig = createCssModuleConfig("layout", {
  element,
  values: { width: "320px" },
});
const appearanceModule = figCreateModule("appearance", {
  element,
  values: { opacity: 0.75 },
  onOptionHover(path, value, interaction) {
    void path;
    void value;
    void interaction.sourceEvent;
  },
});
appearanceModule.mount("#properties");
appearanceModule.setValue("opacity", 0.5);
appearanceModule.destroy();
void capabilities;
void widthCapability;
void layoutConfig;

export const controls = (
  <>
    <fig-module-fills
      fills='[{"type":"solid","color":"#ff0000","visible":true}]'
      multiple
    />
    <fig-module-filters
      filters='[{"type":"gaussian-blur","radius":4,"visible":true}]'
      multiple
    />
    <fig-module-shadows
      shadows='[{"type":"drop","x":0,"y":4,"blur":4,"spread":0,"color":"#00000040","visible":true}]'
      multiple
    />
    <fig-module-transforms
      transforms='[{"type":"translate","x":0,"y":0,"z":0,"visible":true}]'
      multiple
    />
    <fig-fill-picker value="#ff0000" />
    <fig-font-picker
      value="Inter"
      options="Inter,Georgia"
      local-fonts="false"
      google-fonts="false"
    />
    <fig-input-rotate value="0,0,0" />
    <fig-input-slider value="50" />
    <fig-canvas-control />
  </>
);
