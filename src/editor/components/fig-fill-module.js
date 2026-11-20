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

function normalizedOpacity(value, fallback = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
}

function colorWithOpacity(fill, multiplier = 1) {
  const color = typeof fill.color === "string" ? fill.color : DEFAULT_COLOR;
  const opacity = (Number.isFinite(fill.alpha)
    ? Math.max(0, Math.min(1, fill.alpha))
    : normalizedOpacity(fill.opacity)) * multiplier;
  if (opacity >= 1) return color;
  let hex = color;
  if (/^#[0-9a-f]{3,4}$/i.test(hex)) {
    hex = `#${[...hex.slice(1)].map((digit) => digit + digit).join("")}`;
  }
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
    return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
  }
  const alpha = hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1;
  return `${hex.slice(0, 7)}${Math.round(opacity * alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

function gradientCss(fill) {
  const gradient =
    fill.gradient && typeof fill.gradient === "object" ? fill.gradient : {};
  const stops = Array.isArray(gradient.stops) ? gradient.stops : [];
  const opacity = normalizedOpacity(gradient.opacity ?? fill.opacity);
  if (typeof fill.css === "string" && (stops.length === 0 || opacity >= 1)) {
    return fill.css;
  }
  const cssStops = stops.map((stop) => {
    const color = colorWithOpacity({
      ...stop,
      alpha: typeof stop?.alpha === "number" ? stop.alpha : (stop?.opacity ?? 100) / 100,
    }, opacity);
    const position = typeof stop?.position === "number" ? stop.position : 0;
    return `${color} ${position}%`;
  });
  const angle = typeof gradient.angle === "number" ? gradient.angle : 90;
  if (gradient.type === "radial") {
    return `radial-gradient(circle at ${gradient.centerX ?? 50}% ${gradient.centerY ?? 50}%, ${cssStops.join(", ")})`;
  }
  if (gradient.type === "angular" || gradient.type === "conic") {
    return `conic-gradient(from ${angle}deg, ${cssStops.join(", ")})`;
  }
  return `linear-gradient(${angle}deg, ${cssStops.join(", ")})`;
}

function fillLayerCss(fill) {
  if (fill.type === "gradient") return gradientCss(fill);
  if (fill.type === "image") {
    const image =
      fill.image && typeof fill.image === "object" ? fill.image : {};
    if (typeof image.url !== "string" || !image.url) return null;
    const url = `url("${image.url.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
    const opacity = normalizedOpacity(image.opacity ?? fill.opacity);
    if (opacity >= 1) return url;
    const transparent = 'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")';
    const standard = `cross-fade(${url} ${opacity * 100}%, ${transparent})`;
    if (globalThis.CSS?.supports("background-image", standard)) return standard;
    return `-webkit-cross-fade(${url}, ${transparent}, ${1 - opacity})`;
  }
  const color = colorWithOpacity(fill);
  return `linear-gradient(${color}, ${color})`;
}

function backgroundValues(fills) {
  const visible = fills.filter((fill) => fill.visible);
  const bottom = visible[visible.length - 1];
  const bottomIsColor = bottom?.type === "solid";
  const layers = (bottomIsColor ? visible.slice(0, -1) : visible)
    .map((fill) => ({ fill, css: fillLayerCss(fill) }))
    .filter((layer) => layer.css);
  const sizes = layers.map(({ fill }) => {
    if (fill.type !== "image") return "auto";
    if (fill.image?.scaleMode === "fit") return "contain";
    if (fill.image?.scaleMode === "tile") {
      const scale = Number(fill.image.scale ?? 50);
      return `${Number.isFinite(scale) ? Math.max(0, scale) : 50}%`;
    }
    return "cover";
  });
  return {
    "background-color": bottomIsColor
      ? colorWithOpacity(bottom)
      : DEFAULT_COLOR,
    "background-image": layers.length ? layers.map((layer) => layer.css).join(", ") : "none",
    "background-size": sizes.join(", ") || "auto",
    "background-position": layers.map(({ fill }) => fill.type === "image" && fill.image?.scaleMode !== "tile" ? "center" : "0% 0%").join(", ") || "0% 0%",
    "background-repeat": layers.map(({ fill }) => fill.type === "image" && fill.image?.scaleMode !== "tile" ? "no-repeat" : "repeat").join(", ") || "repeat",
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
