import { useEffect, useRef } from "react";
import { createCssModuleConfig } from "../../../css-properties.js";
import { withElementProbe } from "../lib/elementProbe";
import CodeView from "./CodeView";

const FILLS_MODULE_MARKUP = `<fig-module-fills
  fills='[{"type":"solid","color":"#00000000","visible":true}]'
  mode="solid,gradient,image,video"
  value-property="background"
></fig-module-fills>`;

interface FillModuleElement extends HTMLElement {
  fills: Array<Record<string, unknown>>;
  readonly values: Record<string, string | number>;
  multiple: boolean;
}

interface Props {
  elementKind: string;
  onValuesChange: (values: unknown) => void;
  onEventChange: (event: unknown) => void;
}

export default function FillsModuleView({
  elementKind,
  onValuesChange,
  onEventChange,
}: Props) {
  const moduleRef = useRef<FillModuleElement | null>(null);

  useEffect(() => {
    const module = moduleRef.current;
    if (!module) return;
    const result = withElementProbe(elementKind, (element) =>
      createCssModuleConfig("background", { element }),
    );
    const usesSvgFill = elementKind.startsWith("svg:");
    const property =
      usesSvgFill && "fill" in result.config ? "fill" : "background-color";
    const definition = result.config[property] as
      | { default?: string }
      | undefined;
    const color = definition?.default ?? "#00000000";
    const supportsLayers = !usesSvgFill && "background-image" in result.config;

    module.setAttribute(
      "mode",
      supportsLayers ? "solid,gradient,image,video" : "solid",
    );
    module.setAttribute(
      "value-property",
      supportsLayers ? "background" : "fill",
    );
    module.multiple = supportsLayers;
    module.fills = [{ type: "solid", color, visible: true }];
    onValuesChange(module.values);
    onEventChange(null);
  }, [elementKind, onEventChange, onValuesChange]);

  useEffect(() => {
    const module = moduleRef.current;
    if (!module) return;
    const handleUpdate = (event: Event) => {
      const detail =
        event instanceof CustomEvent &&
        event.detail &&
        typeof event.detail === "object"
          ? event.detail
          : {};
      onValuesChange(module.values);
      onEventChange(detail);
    };
    module.addEventListener("input", handleUpdate);
    module.addEventListener("change", handleUpdate);
    return () => {
      module.removeEventListener("input", handleUpdate);
      module.removeEventListener("change", handleUpdate);
    };
  }, [onEventChange, onValuesChange]);

  return (
    <>
      <div className="example-view-container" data-fills-module>
        <div className="propkit-example propkit-example-preview">
          <div className="prop-panel">
            <fig-module-fills ref={moduleRef}></fig-module-fills>
          </div>
        </div>
      </div>
      <CodeView
        markup={FILLS_MODULE_MARKUP}
        readOnly
        showPromptAction={false}
        title="HTML"
      />
    </>
  );
}
