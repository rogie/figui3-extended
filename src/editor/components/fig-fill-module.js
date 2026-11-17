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

const DEFAULT_COLOR = "#00000000";
const FILL_LABELS = {
  solid: "Color",
  gradient: "Gradient",
  image: "Image",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeFill(fill) {
  const source =
    fill?.value && typeof fill.value === "object" ? fill.value : fill;
  if (!source || typeof source !== "object") return null;
  const type =
    source.type === "gradient" || source.type === "image"
      ? source.type
      : "solid";
  return {
    ...clone(source),
    type,
    visible: fill?.visible !== false && source.visible !== false,
  };
}

function parseFills(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeFill).filter(Boolean);
  } catch {
    return [];
  }
}

function inputFill(fill) {
  const { visible: _visible, ...value } = fill;
  return value;
}

function defaultFill(type = "solid", color = DEFAULT_COLOR) {
  if (type === "gradient") {
    return {
      type,
      gradient: {
        type: "linear",
        angle: 90,
        stops: [
          { position: 0, color: "#0D99FF", opacity: 100 },
          { position: 100, color: "#9747FF", opacity: 100 },
        ],
      },
      visible: true,
    };
  }
  if (type === "image") {
    return {
      type,
      image: {
        url: "",
        scaleMode: "fill",
        scale: 50,
        opacity: 1,
      },
      visible: true,
    };
  }
  return { type: "solid", color, visible: true };
}

function colorWithOpacity(fill) {
  const color = typeof fill.color === "string" ? fill.color : DEFAULT_COLOR;
  const rawOpacity = typeof fill.opacity === "number" ? fill.opacity : 100;
  const opacity = Math.max(
    0,
    Math.min(100, rawOpacity <= 1 ? rawOpacity * 100 : rawOpacity),
  );
  if (opacity >= 100 || !/^#[0-9a-f]{6}$/i.test(color)) return color;
  return `${color}${Math.round((opacity / 100) * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

function gradientCss(fill) {
  if (typeof fill.css === "string") return fill.css;
  const gradient =
    fill.gradient && typeof fill.gradient === "object" ? fill.gradient : {};
  const stops = Array.isArray(gradient.stops) ? gradient.stops : [];
  const cssStops = stops.map((stop) => {
    const color = colorWithOpacity(stop ?? {});
    const position = typeof stop?.position === "number" ? stop.position : 0;
    return `${color} ${position}%`;
  });
  const angle = typeof gradient.angle === "number" ? gradient.angle : 90;
  return `linear-gradient(${angle}deg, ${cssStops.join(", ")})`;
}

function fillLayerCss(fill) {
  if (fill.type === "gradient") return gradientCss(fill);
  if (fill.type === "image") {
    const image =
      fill.image && typeof fill.image === "object" ? fill.image : {};
    return typeof image.url === "string" && image.url
      ? `url("${image.url.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`
      : null;
  }
  const color = colorWithOpacity(fill);
  return `linear-gradient(${color}, ${color})`;
}

function backgroundValues(fills) {
  const visible = fills.filter((fill) => fill.visible);
  const bottom = visible[visible.length - 1];
  const bottomIsColor = bottom?.type === "solid";
  const layers = (bottomIsColor ? visible.slice(0, -1) : visible)
    .map(fillLayerCss)
    .filter(Boolean);
  return {
    "background-color": bottomIsColor
      ? colorWithOpacity(bottom)
      : DEFAULT_COLOR,
    "background-image": layers.length ? layers.join(", ") : "none",
  };
}

/**
 * Framework-neutral fill-list property module.
 *
 * @element fig-module-fills
 * @attr {string} fills - JSON array of fill objects
 * @attr {string} mode - Comma-separated supported fill types
 * @attr {boolean} multiple - Set to "false" for a single fill
 * @attr {string} value-property - "background" (default) or "fill"
 */
class FigModuleFills extends HTMLElement {
  #fills = [];
  #reflecting = false;

  static get observedAttributes() {
    return ["fills", "label", "mode", "multiple", "value-property", "disabled"];
  }

  get fills() {
    return clone(this.#fills);
  }

  set fills(value) {
    if (typeof value === "string") {
      this.setAttribute("fills", value);
    } else {
      this.setAttribute("fills", JSON.stringify(value ?? []));
    }
  }

  get values() {
    if (this.valueProperty === "fill") {
      const fill = this.#fills.find((candidate) => candidate.visible);
      return { fill: fill ? colorWithOpacity(fill) : DEFAULT_COLOR };
    }
    return backgroundValues(this.#fills);
  }

  get multiple() {
    return this.getAttribute("multiple") !== "false";
  }

  set multiple(value) {
    this.setAttribute("multiple", value ? "true" : "false");
  }

  get valueProperty() {
    return this.getAttribute("value-property") || "background";
  }

  connectedCallback() {
    this.classList.add("fig-module");
    if (this.hasAttribute("fills")) {
      this.#fills = parseFills(this.getAttribute("fills"));
    } else {
      this.#fills = [defaultFill()];
      this.#reflect();
    }
    this.#render();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected || this.#reflecting) return;
    if (name === "fills") {
      this.#fills = parseFills(this.getAttribute("fills"));
    }
    this.#render();
  }

  #modes() {
    const values = (this.getAttribute("mode") || "solid,gradient,image")
      .split(",")
      .map((value) => value.trim())
      .filter((value) =>
        Object.prototype.hasOwnProperty.call(FILL_LABELS, value),
      );
    return values.length ? values : ["solid"];
  }

  #reflect() {
    this.#reflecting = true;
    this.setAttribute("fills", JSON.stringify(this.#fills));
    this.#reflecting = false;
  }

  #emit(type, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        detail: {
          fills: this.fills,
          values: this.values,
          phase: type,
          path: "fills",
          ...detail,
        },
      }),
    );
  }

  #replaceFills(fills, type, detail, render = true) {
    this.#fills = fills;
    this.#reflect();
    if (render) this.#render();
    this.#emit(type, detail);
  }

  #openEditor(index) {
    requestAnimationFrame(() => {
      if (!this.isConnected) return;
      const property = this.querySelectorAll("fig-reorder > fig-property")[index];
      const picker = property?.querySelector("fig-input-fill fig-fill-picker");
      if (typeof picker?.open === "function") {
        picker.open();
        return;
      }
      property?.querySelector("input, select, textarea, button")?.focus();
    });
  }

  #render() {
    const disabled =
      this.hasAttribute("disabled") && this.getAttribute("disabled") !== "false";
    const modes = this.#modes();
    const group = document.createElement("fig-group");
    group.setAttribute("compact", "");
    group.className = "fills-group";

    const header = document.createElement("fig-header");
    header.setAttribute("borderless", "");
    const title = document.createElement("h3");
    title.textContent = this.getAttribute("label") || "Fills";
    header.append(title);

    const menu = document.createElement("fig-menu");
    menu.setAttribute("position", "bottom right");
    const addButton = document.createElement("fig-button");
    addButton.setAttribute("variant", "ghost");
    addButton.setAttribute("icon", "");
    addButton.setAttribute("fig-menu-trigger", "");
    addButton.setAttribute("aria-label", "Add fill");
    if (disabled || (!this.multiple && this.#fills.length > 0)) {
      addButton.setAttribute("disabled", "");
    }
    const addIcon = document.createElement("fig-icon");
    addIcon.setAttribute("name", "add");
    addButton.append(addIcon);
    menu.append(addButton);
    modes.forEach((mode) => {
      const item = document.createElement("fig-menu-item");
      item.setAttribute("value", mode);
      item.textContent = FILL_LABELS[mode];
      menu.append(item);
    });
    menu.addEventListener("change", (event) => {
      event.stopPropagation();
      const type = event.detail?.value;
      if (!modes.includes(type) || (!this.multiple && this.#fills.length > 0)) {
        return;
      }
      const fill = defaultFill(type);
      const index = this.#fills.length;
      this.#replaceFills(
        [...this.#fills, fill],
        "change",
        { action: "add", index, value: clone(fill) },
      );
      this.#openEditor(index);
    });
    header.append(menu);
    group.append(header);

    const reorder = document.createElement("fig-reorder");
    reorder.setAttribute(
      "handle",
      'fig-icon[slot="leading"][name="drag-handle"]',
    );
    reorder.addEventListener("reorder", (event) => {
      event.stopPropagation();
      const { oldIndex, newIndex } = event.detail ?? {};
      if (
        typeof oldIndex !== "number" ||
        typeof newIndex !== "number" ||
        oldIndex === newIndex
      ) {
        return;
      }
      const fills = [...this.#fills];
      const [moved] = fills.splice(oldIndex, 1);
      if (!moved) return;
      fills.splice(newIndex, 0, moved);
      this.#replaceFills(fills, "change", {
        action: "reorder",
        oldIndex,
        newIndex,
      });
    });

    this.#fills.forEach((fill, index) => {
      const property = document.createElement("fig-property");
      property.setAttribute(
        "aria-label",
        `${FILL_LABELS[fill.type] ?? "Color"} fill`,
      );
      property.setAttribute("show-trailing", "");
      if (this.#fills.length > 1) property.setAttribute("leading", "drag");

      const input = document.createElement("fig-input-fill");
      input.setAttribute("slot", "input");
      input.setAttribute("mode", modes.join(","));
      input.setAttribute("value", JSON.stringify(inputFill(fill)));
      input.setAttribute("full", "");
      if (disabled || !fill.visible) input.setAttribute("disabled", "");
      const update = (event) => {
        event.stopPropagation();
        const value =
          event.detail && typeof event.detail === "object"
            ? event.detail
            : input.value;
        const next = normalizeFill({ value, visible: fill.visible });
        if (!next) return;
        const fills = this.#fills.map((candidate, candidateIndex) =>
          candidateIndex === index ? next : candidate,
        );
        this.#replaceFills(
          fills,
          event.type,
          { index, path: `fills.${index}`, value: clone(next) },
          false,
        );
      };
      input.addEventListener("input", update);
      input.addEventListener("change", update);
      property.append(
        figEditorWithTooltip(
          `${FILL_LABELS[fill.type] ?? "Color"} fill`,
          input,
        ),
      );

      const actions = document.createElement("fig-stack");
      actions.setAttribute("slot", "trailing");
      actions.setAttribute("gap", "1");
      const visibility = document.createElement("fig-button");
      visibility.setAttribute("variant", "ghost");
      visibility.setAttribute("icon", "");
      visibility.setAttribute(
        "aria-label",
        fill.visible ? "Hide fill" : "Show fill",
      );
      visibility.toggleAttribute("selected", !fill.visible);
      if (disabled) visibility.setAttribute("disabled", "");
      const visibilityIcon = document.createElement("fig-icon");
      visibilityIcon.setAttribute(
        "name",
        fill.visible ? "visible" : "hidden",
      );
      visibility.append(visibilityIcon);
      visibility.addEventListener("click", () => {
        const fills = this.#fills.map((candidate, candidateIndex) =>
          candidateIndex === index
            ? { ...candidate, visible: !candidate.visible }
            : candidate,
        );
        this.#replaceFills(fills, "change", {
          action: "visibility",
          index,
          path: `fills.${index}.visible`,
          value: fills[index].visible,
        });
      });
      actions.append(
        figEditorWithTooltip(
          fill.visible ? "Hide fill" : "Show fill",
          visibility,
        ),
      );

      const remove = document.createElement("fig-button");
      remove.setAttribute("variant", "ghost");
      remove.setAttribute("icon", "");
      remove.setAttribute("aria-label", "Remove fill");
      if (disabled) remove.setAttribute("disabled", "");
      const removeIcon = document.createElement("fig-icon");
      removeIcon.setAttribute("name", "minus");
      remove.append(removeIcon);
      remove.addEventListener("click", () => {
        this.#replaceFills(
          this.#fills.filter((_, candidateIndex) => candidateIndex !== index),
          "change",
          { action: "remove", index },
        );
      });
      actions.append(figEditorWithTooltip("Remove fill", remove));
      property.append(actions);
      reorder.append(property);
    });

    if (this.#fills.length > 0) group.append(reorder);
    this.replaceChildren(group);
    queueMicrotask(() => {
      if (reorder.isConnected) reorder.refresh();
    });
  }
}

figEditorDefineElement("fig-module-fills", FigModuleFills);

export {
  FigModuleFills,
  FigModuleFills as FigFillModule,
  backgroundValues as figFillModuleBackgroundValues,
};
