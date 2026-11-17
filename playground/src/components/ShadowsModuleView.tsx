import { useEffect, useRef } from "react";

interface ShadowModuleElement extends HTMLElement {
  shadows: Array<Record<string, unknown>>;
  readonly values: Record<string, string>;
}

interface Props {
  onValuesChange: (values: unknown) => void;
  onEventChange: (event: unknown) => void;
}

export default function ShadowsModuleView({
  onValuesChange,
  onEventChange,
}: Props) {
  const moduleRef = useRef<ShadowModuleElement | null>(null);

  useEffect(() => {
    const module = moduleRef.current;
    if (!module) return;
    module.shadows = [
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
    onValuesChange(module.values);
    onEventChange(null);
  }, [onEventChange, onValuesChange]);

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
    <div className="example-view-container" data-shadows-module>
      <div className="propkit-example propkit-example-preview">
        <div className="prop-panel">
          <fig-module-shadows ref={moduleRef}></fig-module-shadows>
        </div>
      </div>
    </div>
  );
}
