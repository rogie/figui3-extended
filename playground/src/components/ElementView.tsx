import React from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const OPTIONS = [
  { value: "", label: "Any element" },
  { value: "div", label: "div" },
  { value: "span", label: "span" },
  { value: "img", label: "img" },
  { value: "canvas", label: "canvas" },
  { value: "svg:svg", label: "svg" },
  { value: "svg:g", label: "svg / g" },
  { value: "svg:path", label: "svg / path" },
  { value: "svg:rect", label: "svg / rect" },
  { value: "svg:circle", label: "svg / circle" },
  { value: "svg:ellipse", label: "svg / ellipse" },
  { value: "svg:line", label: "svg / line" },
  { value: "svg:polygon", label: "svg / polygon" },
  { value: "svg:text", label: "svg / text" },
];

export default function ElementView({ value, onChange }: Props) {
  return (
    <div className="propkit-attributes-view" data-propskit-element>
      <fig-header borderless>
        <h3>Element</h3>
      </fig-header>
      <section className="propkit-attributes-content propkit-element-content">
        <fig-select
          value={value || "__any__"}
          label="Element type"
          full
          onInput={(event: React.FormEvent<HTMLElement>) => {
            const select = event.currentTarget as HTMLElement & {
              value?: string;
            };
            onChange(select.value === "__any__" ? "" : (select.value ?? ""));
          }}
        >
          <fig-select-options slot="panel">
            {OPTIONS.map((option) => (
              <fig-select-option
                key={option.value || "__any__"}
                value={option.value || "__any__"}
              >
                {option.label}
              </fig-select-option>
            ))}
          </fig-select-options>
        </fig-select>
      </section>
    </div>
  );
}
