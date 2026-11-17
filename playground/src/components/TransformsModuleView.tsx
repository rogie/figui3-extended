import { useEffect, useRef } from "react";

interface TransformModuleElement extends HTMLElement {
  transforms: Array<Record<string, unknown>>;
  readonly values: Record<string, string>;
}

interface Props {
  onValuesChange: (values: unknown) => void;
  onEventChange: (event: unknown) => void;
}

export default function TransformsModuleView({
  onValuesChange,
  onEventChange,
}: Props) {
  const moduleRef = useRef<TransformModuleElement | null>(null);

  useEffect(() => {
    const module = moduleRef.current;
    if (!module) return;
    module.transforms = [
      { type: "translate", x: 0, y: 0, z: 0, visible: true },
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
    <div className="example-view-container" data-transforms-module>
      <div className="propkit-example propkit-example-preview">
        <div className="prop-panel">
          <fig-module-transforms ref={moduleRef}></fig-module-transforms>
        </div>
      </div>
    </div>
  );
}
