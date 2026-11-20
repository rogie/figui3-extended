/*
PolyForm Shield License 1.0.0
https://polyformproject.org/licenses/shield/1.0.0
Required Notice: Copyright (c) 2026 Rogie King
Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)
*/
import {
  HTMLElement,
  CustomEvent,
  figEditorDefineElement,
  figEditorWithTooltip,
} from "../runtime/helpers.js";
import { FIG_EDITOR_BLUR_ICON } from "../runtime/icons.js";

const FILTER_TYPES = {
  "gaussian-blur": {
    label: "Blur",
    primitive: "feGaussianBlur",
    defaults: { radius: 4 },
  },
  "hue-rotate": {
    label: "Hue rotate",
    primitive: "feColorMatrix",
    defaults: { angle: 0 },
  },
  saturate: {
    label: "Saturation",
    primitive: "feColorMatrix",
    defaults: { amount: 1 },
  },
  brightness: {
    label: "Brightness",
    primitive: "feComponentTransfer",
    defaults: { amount: 1 },
  },
  contrast: {
    label: "Contrast",
    primitive: "feComponentTransfer",
    defaults: { amount: 1 },
  },
  grayscale: {
    label: "Grayscale",
    primitive: "feColorMatrix",
    defaults: { amount: 1 },
  },
  invert: {
    label: "Invert",
    primitive: "feComponentTransfer",
    defaults: { amount: 1 },
  },
  sepia: {
    label: "Sepia",
    primitive: "feColorMatrix",
    defaults: { amount: 1 },
  },
};

const FILTER_TARGETS = [
  { value: "layer", label: "Layer", property: "filter" },
  { value: "backdrop", label: "Backdrop", property: "backdrop-filter" },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeFilter(filter) {
  if (!filter || typeof filter !== "object") return null;
  const type = Object.prototype.hasOwnProperty.call(FILTER_TYPES, filter.type)
    ? filter.type
    : "gaussian-blur";
  const definition = FILTER_TYPES[type];
  const normalized = {
    ...clone(definition.defaults),
    ...clone(filter),
    type,
    target: filter.target === "backdrop" ? "backdrop" : "layer",
    primitive: definition.primitive,
    visible: filter.visible !== false,
  };
  for (const [key, fallback] of Object.entries(definition.defaults)) {
    const value = number(normalized[key], fallback);
    normalized[key] = type === "hue-rotate" ? value : Math.max(0, value);
  }
  return normalized;
}

function parseFilters(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeFilter).filter(Boolean);
  } catch {
    return [];
  }
}

function defaultFilter(type = "gaussian-blur", target = "layer") {
  return normalizeFilter({ type, target });
}

function filterCss(filter) {
  switch (filter.type) {
    case "hue-rotate":
      return `hue-rotate(${number(filter.angle, 0)}deg)`;
    case "saturate":
    case "brightness":
    case "contrast":
    case "grayscale":
    case "invert":
    case "sepia": {
      const name = filter.type === "saturate" ? "saturate" : filter.type;
      return `${name}(${number(filter.amount, 1)})`;
    }
    default:
      return `blur(${number(filter.radius, 4)}px)`;
  }
}

function filterValues(filters) {
  return Object.fromEntries(
    FILTER_TARGETS.map((target) => {
      const value = filters
        .filter(
          (filter) => filter.visible && filter.target === target.value,
        )
        .map(filterCss)
        .join(" ");
      return [target.property, value || "none"];
    }),
  );
}

function createIconButton(label, iconName) {
  const button = document.createElement("fig-button");
  button.setAttribute("variant", "ghost");
  button.setAttribute("icon", "");
  button.setAttribute("aria-label", label);
  const icon = document.createElement("fig-icon");
  icon.setAttribute("name", iconName);
  button.append(icon);
  return button;
}

/**
 * Ordered SVG-derived filter property module.
 *
 * @element fig-module-filters
 * @attr {string} filters - JSON array of filter objects
 * @attr {boolean} multiple - Set to "false" for a single filter
 */
class FigModuleFilters extends HTMLElement {
  #filters = [];
  #reflecting = false;

  static get observedAttributes() {
    return ["filters", "label", "multiple", "disabled"];
  }

  get filters() {
    return clone(this.#filters);
  }

  set filters(value) {
    this.setAttribute(
      "filters",
      typeof value === "string" ? value : JSON.stringify(value ?? []),
    );
  }

  get values() {
    return filterValues(this.#filters);
  }

  get multiple() {
    return this.getAttribute("multiple") !== "false";
  }

  set multiple(value) {
    this.setAttribute("multiple", value ? "true" : "false");
  }

  connectedCallback() {
    this.classList.add("fig-module");
    if (this.hasAttribute("filters")) {
      this.#filters = parseFilters(this.getAttribute("filters"));
    } else {
      this.#filters = [defaultFilter()];
      this.#reflect();
    }
    this.#render();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected || this.#reflecting) return;
    if (name === "filters") {
      this.#filters = parseFilters(this.getAttribute("filters"));
    }
    this.#render();
  }

  #reflect() {
    this.#reflecting = true;
    this.setAttribute("filters", JSON.stringify(this.#filters));
    this.#reflecting = false;
  }

  #emit(type, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        detail: {
          filters: this.filters,
          values: this.values,
          phase: type,
          path: "filters",
          ...detail,
        },
      }),
    );
  }

  #replaceFilters(filters, type, detail, render = true) {
    this.#filters = filters;
    this.#reflect();
    if (render) this.#render();
    this.#emit(type, detail);
  }

  #focusEditor(index) {
    requestAnimationFrame(() => {
      if (!this.isConnected) return;
      const property = this.querySelector(
        `fig-reorder > fig-property[data-filter-index="${index}"]`,
      );
      property?.querySelector("fig-input-number:not([disabled])")?.focus();
    });
  }

  #updateFilter(index, patch, phase, sourceEvent, render = false) {
    sourceEvent?.stopPropagation();
    const next = normalizeFilter({ ...this.#filters[index], ...patch });
    if (!next) return;
    const filters = this.#filters.map((filter, candidateIndex) =>
      candidateIndex === index ? next : filter,
    );
    this.#replaceFilters(
      filters,
      phase,
      { index, path: `filters.${index}`, value: clone(next) },
      render,
    );
  }

  #render() {
    const disabled =
      this.hasAttribute("disabled") && this.getAttribute("disabled") !== "false";
    const group = document.createElement("fig-group");
    group.className = "filters-group";

    const header = document.createElement("fig-header");
    header.setAttribute("borderless", "");
    const title = document.createElement("h3");
    title.textContent = this.getAttribute("label") || "Filters";
    header.append(title);

    const menu = document.createElement("fig-menu");
    menu.setAttribute("position", "bottom right");
    const add = createIconButton("Add filter", "add");
    add.setAttribute("fig-menu-trigger", "");
    if (disabled || (!this.multiple && this.#filters.length > 0)) {
      add.setAttribute("disabled", "");
    }
    menu.append(add);
    FILTER_TARGETS.forEach((target, targetIndex) => {
      if (targetIndex > 0) {
        menu.append(document.createElement("fig-menu-separator"));
      }
      const heading = document.createElement("fig-menu-item");
      heading.setAttribute("disabled", "");
      heading.textContent = target.label;
      menu.append(heading);
      Object.entries(FILTER_TYPES).forEach(([type, definition]) => {
        const item = document.createElement("fig-menu-item");
        item.setAttribute("value", `${target.value}:${type}`);
        item.textContent = definition.label;
        menu.append(item);
      });
    });
    menu.addEventListener("change", (event) => {
      event.stopPropagation();
      const [target, type] = String(event.detail?.value ?? "").split(":");
      if (
        !FILTER_TARGETS.some((candidate) => candidate.value === target) ||
        !Object.prototype.hasOwnProperty.call(FILTER_TYPES, type) ||
        (!this.multiple && this.#filters.length > 0)
      ) {
        return;
      }
      const filter = defaultFilter(type, target);
      const index = this.#filters.length;
      this.#replaceFilters(
        [...this.#filters, filter],
        "change",
        { action: "add", index, value: clone(filter) },
      );
      this.#focusEditor(index);
    });
    header.append(menu);
    group.append(header);

    const createReorder = (target) => {
      const reorder = document.createElement("fig-reorder");
      reorder.setAttribute("aria-label", `${target.label} filters`);
      reorder.setAttribute(
        "handle",
        'fig-icon[slot="leading"][name="drag-handle"]',
      );
      reorder.addEventListener("reorder", (event) => {
        event.stopPropagation();
        const oldIndex = event.detail?.oldIndex ?? event.detail?.from;
        const newIndex = event.detail?.newIndex ?? event.detail?.to;
        if (
          typeof oldIndex !== "number" ||
          typeof newIndex !== "number" ||
          oldIndex === newIndex
        ) {
          return;
        }
        const targetIndexes = this.#filters.flatMap((filter, index) =>
          filter.target === target.value ? [index] : [],
        );
        const targetFilters = targetIndexes.map((index) => this.#filters[index]);
        const [moved] = targetFilters.splice(oldIndex, 1);
        if (
          !moved ||
          newIndex < 0 ||
          newIndex >= targetIndexes.length
        ) {
          return;
        }
        targetFilters.splice(newIndex, 0, moved);
        const filters = [...this.#filters];
        targetIndexes.forEach((filterIndex, index) => {
          filters[filterIndex] = targetFilters[index];
        });
        this.#replaceFilters(filters, "change", {
          action: "reorder",
          target: target.value,
          oldIndex: targetIndexes[oldIndex],
          newIndex: targetIndexes[newIndex],
        });
      });
      return reorder;
    };
    const reorders = Object.fromEntries(
      FILTER_TARGETS.map((target) => [target.value, createReorder(target)]),
    );
    const targetCounts = Object.fromEntries(
      FILTER_TARGETS.map((target) => [
        target.value,
        this.#filters.filter((filter) => filter.target === target.value).length,
      ]),
    );

    this.#filters.forEach((filter, index) => {
      const property = document.createElement("fig-property");
      property.setAttribute("data-filter-index", String(index));
      property.setAttribute(
        "aria-label",
        `${filter.target === "backdrop" ? "Backdrop " : ""}${FILTER_TYPES[filter.type].label} filter`,
      );
      property.setAttribute("show-trailing", "");
      if (targetCounts[filter.target] > 1) {
        property.setAttribute("leading", "drag");
      }

      const controls = document.createElement("fig-stack");
      controls.setAttribute("slot", "input");
      controls.setAttribute("full", "");

      const typeSelect = document.createElement("fig-select");
      typeSelect.setAttribute("full", "");
      typeSelect.style.cssText = "flex: 1 1 0; min-width: 0";
      typeSelect.setAttribute("value", `${filter.target}:${filter.type}`);
      typeSelect.setAttribute("label", "Filter type");
      if (disabled || !filter.visible) typeSelect.setAttribute("disabled", "");
      const options = document.createElement("fig-select-options");
      options.setAttribute("slot", "panel");
      FILTER_TARGETS.forEach((target, targetIndex) => {
        if (targetIndex > 0) {
          options.append(document.createElement("fig-separator"));
        }
        const heading = document.createElement("fig-select-option");
        heading.setAttribute("label", target.label);
        heading.setAttribute("disabled", "");
        heading.textContent = target.label;
        options.append(heading);
        Object.entries(FILTER_TYPES).forEach(([type, definition]) => {
          const option = document.createElement("fig-select-option");
          option.setAttribute("value", `${target.value}:${type}`);
          option.setAttribute("label", definition.label);
          option.textContent = definition.label;
          options.append(option);
        });
      });
      typeSelect.append(options);
      typeSelect.addEventListener("change", (event) => {
        event.stopPropagation();
        const [target, type] = String(
          event.detail?.value ?? typeSelect.value,
        ).split(":");
        if (
          !FILTER_TARGETS.some((candidate) => candidate.value === target) ||
          !Object.prototype.hasOwnProperty.call(FILTER_TYPES, type)
        ) {
          return;
        }
        this.#updateFilter(
          index,
          defaultFilter(type, target),
          "change",
          event,
          true,
        );
      });
      controls.append(figEditorWithTooltip("Filter type", typeSelect));

      const valueInput = document.createElement("fig-input-number");
      valueInput.setAttribute("full", "");
      valueInput.style.cssText = "flex: 1 1 0; min-width: 0";
      valueInput.setAttribute("min", "0");
      valueInput.setAttribute("step", "1");
      valueInput.setAttribute(
        "aria-label",
        `${FILTER_TYPES[filter.type].label} value`,
      );
      let valueKey = "amount";
      let fallback = 100;
      let toStoredValue = (value) => value / 100;
      if (filter.type === "gaussian-blur") {
        valueKey = "radius";
        fallback = number(filter.radius, 4);
        toStoredValue = (value) => value;
        valueInput.setAttribute("value", String(fallback));
        valueInput.setAttribute("units", "px");
        const icon = document.createElement("fig-icon");
        icon.setAttribute("slot", "prepend");
        icon.innerHTML = FIG_EDITOR_BLUR_ICON;
        valueInput.append(icon);
      } else if (filter.type === "hue-rotate") {
        valueKey = "angle";
        fallback = number(filter.angle, 0);
        toStoredValue = (value) => value;
        valueInput.setAttribute("value", String(fallback));
        valueInput.removeAttribute("min");
        valueInput.setAttribute("units", "°");
      } else {
        fallback = Math.round(number(filter.amount, 1) * 100);
        valueInput.setAttribute("value", String(fallback));
        valueInput.setAttribute("units", "%");
        if (["grayscale", "invert", "sepia"].includes(filter.type)) {
          valueInput.setAttribute("max", "100");
        }
      }
      if (disabled || !filter.visible) valueInput.setAttribute("disabled", "");
      const updateValue = (event) => {
        event.stopPropagation();
        const nextValue = number(
          event.detail?.value ?? valueInput.value,
          fallback,
        );
        this.#updateFilter(
          index,
          { [valueKey]: toStoredValue(nextValue) },
          event.type,
          event,
        );
      };
      valueInput.addEventListener("input", updateValue);
      valueInput.addEventListener("change", updateValue);
      controls.append(
        figEditorWithTooltip(
          `${FILTER_TYPES[filter.type].label} value`,
          valueInput,
        ),
      );
      property.append(controls);

      const actions = document.createElement("fig-stack");
      actions.setAttribute("slot", "trailing");
      actions.setAttribute("gap", "1");
      const visibility = createIconButton(
        filter.visible ? "Hide filter" : "Show filter",
        filter.visible ? "visible" : "hidden",
      );
      visibility.toggleAttribute("selected", !filter.visible);
      if (disabled) visibility.setAttribute("disabled", "");
      visibility.addEventListener("click", () => {
        this.#updateFilter(
          index,
          { visible: !filter.visible },
          "change",
          null,
          true,
        );
      });
      const remove = createIconButton("Remove filter", "minus");
      if (disabled) remove.setAttribute("disabled", "");
      remove.addEventListener("click", () => {
        this.#replaceFilters(
          this.#filters.filter((_, candidateIndex) => candidateIndex !== index),
          "change",
          { action: "remove", index },
        );
      });
      actions.append(
        figEditorWithTooltip(
          filter.visible ? "Hide filter" : "Show filter",
          visibility,
        ),
        figEditorWithTooltip("Remove filter", remove),
      );
      property.append(actions);
      reorders[filter.target].append(property);
    });

    if (targetCounts.layer > 0) group.append(reorders.layer);
    if (targetCounts.backdrop > 0) {
      const separator = document.createElement("fig-separator");
      separator.setAttribute("label", "Backdrop");
      group.append(separator, reorders.backdrop);
    }
    this.replaceChildren(group);
    queueMicrotask(() => {
      Object.values(reorders).forEach((reorder) => {
        if (reorder.isConnected) reorder.refresh();
      });
    });
  }
}

figEditorDefineElement("fig-module-filters", FigModuleFilters);

export {
  FigModuleFilters,
  FigModuleFilters as FigFilterModule,
  filterValues as figFilterModuleValues,
};
