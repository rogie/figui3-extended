import { useEffect, useRef } from "react";
import CodeView from "./CodeView";

const FILTERS_MODULE_MARKUP = `<fig-module-filters
  filters='[{"type":"gaussian-blur","radius":4,"visible":true}]'
></fig-module-filters>`;

interface FilterModuleElement extends HTMLElement {
  filters: Array<Record<string, unknown>>;
  readonly values: Record<string, string>;
}

interface Props {
  onValuesChange: (values: unknown) => void;
  onEventChange: (event: unknown) => void;
}

export default function FiltersModuleView({
  onValuesChange,
  onEventChange,
}: Props) {
  const moduleRef = useRef<FilterModuleElement | null>(null);

  useEffect(() => {
    const module = moduleRef.current;
    if (!module) return;
    module.filters = [
      {
        type: "gaussian-blur",
        primitive: "feGaussianBlur",
        radius: 4,
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
    <>
      <div className="example-view-container" data-filters-module>
        <div className="propkit-example propkit-example-preview">
          <div className="prop-panel">
            <fig-module-filters ref={moduleRef}></fig-module-filters>
          </div>
        </div>
      </div>
      <CodeView
        markup={FILTERS_MODULE_MARKUP}
        readOnly
        showPromptAction={false}
        title="HTML"
      />
    </>
  );
}
