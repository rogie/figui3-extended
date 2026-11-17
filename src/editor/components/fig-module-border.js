/*
PolyForm Shield License 1.0.0
https://polyformproject.org/licenses/shield/1.0.0
Required Notice: Copyright (c) 2026 Rogie King
Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)
*/
import {
  HTMLElement,
  figEditorDefineElement,
} from "../runtime/helpers.js";

class FigModuleBorder extends HTMLElement {}

figEditorDefineElement("fig-module-border", FigModuleBorder);

export { FigModuleBorder };
