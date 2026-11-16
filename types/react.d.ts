import type { FigTagNameMap } from "@rogieking/figui3";
import type { FigReactProps } from "@rogieking/figui3/react";
import type { FigExtendedTagNameMap } from "./index.js";

export type FigExtendedReactIntrinsicElements = {
  [K in keyof FigExtendedTagNameMap]: FigReactProps<
    K extends keyof FigTagNameMap
      ? FigTagNameMap[K]
      : FigExtendedTagNameMap[K]
  >;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends FigExtendedReactIntrinsicElements {}
  }
}
