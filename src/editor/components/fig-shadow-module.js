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
  figEditorUniqueId,
} from "../runtime/helpers.js";

const SHADOW_TYPES = {
  drop: {
    label: "Drop shadow",
    defaults: { x: 0, y: 4, blur: 4, spread: 0, color: "#00000040" },
  },
  inner: {
    label: "Inner shadow",
    defaults: { x: 0, y: 2, blur: 4, spread: 0, color: "#00000040" },
  },
  text: {
    label: "Text shadow",
    defaults: { x: 0, y: 2, blur: 4, color: "#00000040" },
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeShadow(shadow) {
  if (!shadow || typeof shadow !== "object") return null;
  const type = Object.prototype.hasOwnProperty.call(SHADOW_TYPES, shadow.type)
    ? shadow.type
    : "drop";
  const defaults = SHADOW_TYPES[type].defaults;
  const normalized = {
    ...clone(defaults),
    ...clone(shadow),
    type,
    x: number(shadow.x, defaults.x),
    y: number(shadow.y, defaults.y),
    blur: Math.max(0, number(shadow.blur, defaults.blur)),
    color:
      typeof shadow.color === "string" && shadow.color
        ? shadow.color
        : defaults.color,
    visible: shadow.visible !== false,
  };
  if (type === "text") {
    delete normalized.spread;
  } else {
    normalized.spread = number(shadow.spread, defaults.spread);
  }
  return normalized;
}

function parseShadows(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeShadow).filter(Boolean);
  } catch {
    return [];
  }
}

function defaultShadow(type = "drop") {
  return normalizeShadow({ type });
}

function length(value) {
  const normalized = number(value, 0);
  return `${Object.is(normalized, -0) ? 0 : normalized}px`;
}

function shadowCss(shadow) {
  const parts = [
    length(shadow.x),
    length(shadow.y),
    length(shadow.blur),
  ];
  if (shadow.type !== "text") parts.push(length(shadow.spread));
  parts.push(shadow.color);
  if (shadow.type === "inner") parts.push("inset");
  return parts.join(" ");
}

function shadowValues(shadows) {
  const visible = shadows.filter((shadow) => shadow.visible);
  const boxShadow = visible
    .filter((shadow) => shadow.type !== "text")
    .map(shadowCss)
    .join(", ");
  const textShadow = visible
    .filter((shadow) => shadow.type === "text")
    .map(shadowCss)
    .join(", ");
  return {
    "box-shadow": boxShadow || "none",
    "text-shadow": textShadow || "none",
  };
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

function eventValue(event, element) {
  const detail = event.detail;
  if (
    detail &&
    typeof detail === "object" &&
    Object.prototype.hasOwnProperty.call(detail, "value")
  ) {
    return detail.value;
  }
  if (typeof detail === "string" || typeof detail === "number") return detail;
  return element.value;
}

function colorValue(event, input, fallback) {
  const detail = event.detail;
  if (detail && typeof detail === "object") {
    if (typeof detail.hex === "string") return detail.hex;
    if (typeof detail.value === "string") return detail.value;
    if (typeof detail.color === "string") {
      if (
        typeof detail.alpha === "number" &&
        /^#[0-9a-f]{6}$/i.test(detail.color)
      ) {
        const alpha =
          detail.alpha <= 1 ? detail.alpha * 255 : (detail.alpha / 100) * 255;
        return `${detail.color}${Math.round(Math.max(0, Math.min(255, alpha)))
          .toString(16)
          .padStart(2, "0")}`;
      }
      return detail.color;
    }
  }
  return typeof input.value === "string" && input.value
    ? input.value
    : fallback;
}

function createNumberInput(label, value, options, onUpdate) {
  const input = document.createElement("fig-input-number");
  input.setAttribute("value", String(value));
  input.setAttribute("units", "px");
  input.setAttribute("full", "");
  input.setAttribute("aria-label", label);
  if (options.min !== undefined) input.setAttribute("min", String(options.min));
  if (options.disabled) input.setAttribute("disabled", "");
  const icon = document.createElement("fig-icon");
  if (options.iconName) icon.setAttribute("name", options.iconName);
  else icon.textContent = options.iconText;
  icon.setAttribute("slot", "prepend");
  input.append(icon);
  const update = (event) => {
    event.stopPropagation();
    onUpdate(event, number(eventValue(event, input), value));
  };
  input.addEventListener("input", update);
  input.addEventListener("change", update);
  return input;
}

/**
 * Hydratable, ordered shadow property module.
 *
 * @element fig-module-shadows
 * @attr {string} shadows - JSON array of shadow objects
 * @attr {boolean} multiple - Set to "false" for a single shadow
 */
class FigModuleShadows extends HTMLElement {
  #shadows = [];
  #reflecting = false;

  static get observedAttributes() {
    return ["shadows", "label", "multiple", "disabled"];
  }

  get shadows() {
    return clone(this.#shadows);
  }

  set shadows(value) {
    this.setAttribute(
      "shadows",
      typeof value === "string" ? value : JSON.stringify(value ?? []),
    );
  }

  get values() {
    return shadowValues(this.#shadows);
  }

  get multiple() {
    return this.getAttribute("multiple") !== "false";
  }

  set multiple(value) {
    this.setAttribute("multiple", value ? "true" : "false");
  }

  connectedCallback() {
    if (this.hasAttribute("shadows")) {
      this.#shadows = parseShadows(this.getAttribute("shadows"));
    } else {
      this.#shadows = [defaultShadow()];
      this.#reflect();
    }
    this.#render();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected || this.#reflecting) return;
    if (name === "shadows") {
      this.#shadows = parseShadows(this.getAttribute("shadows"));
    }
    this.#render();
  }

  #reflect() {
    this.#reflecting = true;
    this.setAttribute("shadows", JSON.stringify(this.#shadows));
    this.#reflecting = false;
  }

  #emit(type, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        detail: {
          shadows: this.shadows,
          values: this.values,
          phase: type,
          path: "shadows",
          ...detail,
        },
      }),
    );
  }

  #replaceShadows(shadows, type, detail, render = true) {
    this.#shadows = shadows;
    this.#reflect();
    if (render) this.#render();
    this.#emit(type, detail);
  }

  #openEditor(index) {
    requestAnimationFrame(() => {
      if (!this.isConnected) return;
      const property = this.querySelectorAll("fig-reorder > fig-property")[index];
      const trigger = property?.querySelector(
        'fig-button[slot="input"][aria-haspopup="dialog"]',
      );
      if (trigger) {
        trigger.click();
        return;
      }
      property?.querySelector("fig-input-number, input, select, textarea")?.focus();
    });
  }

  #updateShadow(index, patch, phase, sourceEvent, render = false) {
    sourceEvent?.stopPropagation();
    const next = normalizeShadow({ ...this.#shadows[index], ...patch });
    if (!next) return;
    const shadows = this.#shadows.map((shadow, candidateIndex) =>
      candidateIndex === index ? next : shadow,
    );
    this.#replaceShadows(
      shadows,
      phase,
      { index, path: `shadows.${index}`, value: clone(next) },
      render,
    );
  }

  #createEditor(shadow, index, trigger, disabled) {
    const popup = document.createElement("dialog", { is: "fig-popup" });
    popup.setAttribute("is", "fig-popup");
    popup.id = figEditorUniqueId();
    popup.setAttribute("anchor", `#${trigger.id}`);
    popup.setAttribute("position", "left");
    popup.setAttribute("offset", "0 8");
    popup.setAttribute("closedby", "any");
    popup.setAttribute("theme", "dark");
    popup.style.width = "15rem";

    const header = document.createElement("fig-header");
    header.setAttribute("dialog-header", "");
    const typeSelect = document.createElement("fig-select");
    typeSelect.setAttribute("variant", "ghost");
    typeSelect.setAttribute("value", shadow.type);
    typeSelect.setAttribute("label", "Shadow type");
    if (disabled) typeSelect.setAttribute("disabled", "");
    const options = document.createElement("fig-select-options");
    options.setAttribute("slot", "panel");
    Object.entries(SHADOW_TYPES).forEach(([type, definition]) => {
      const option = document.createElement("fig-select-option");
      option.setAttribute("value", type);
      option.setAttribute("label", definition.label);
      option.textContent = definition.label;
      options.append(option);
    });
    typeSelect.append(options);
    typeSelect.addEventListener("change", (event) => {
      event.stopPropagation();
      const type = String(eventValue(event, typeSelect));
      if (!Object.prototype.hasOwnProperty.call(SHADOW_TYPES, type)) return;
      this.#updateShadow(index, defaultShadow(type), "change", event, true);
    });
    const close = createIconButton("Close shadow editor", "close");
    close.setAttribute("close-dialog", "");
    header.append(typeSelect, close);
    popup.append(header);
    popup.setAttribute("title", SHADOW_TYPES[shadow.type].label);

    const content = document.createElement("fig-content");
    const positionField = document.createElement("fig-field");
    const positionLabel = document.createElement("label");
    positionLabel.textContent = "Position";
    const positionStack = document.createElement("fig-stack");
    positionStack.setAttribute("direction", "vertical");
    positionStack.setAttribute("full", "");
    positionStack.append(
      createNumberInput(
        "Horizontal offset",
        shadow.x,
        { iconText: "X", disabled },
        (event, value) =>
          this.#updateShadow(index, { x: value }, event.type, event),
      ),
      createNumberInput(
        "Vertical offset",
        shadow.y,
        { iconText: "Y", disabled },
        (event, value) =>
          this.#updateShadow(index, { y: value }, event.type, event),
      ),
    );
    positionField.append(positionLabel, positionStack);
    content.append(positionField);

    const appendNumberField = (label, key, options) => {
      const field = document.createElement("fig-field");
      const fieldLabel = document.createElement("label");
      fieldLabel.textContent = label;
      field.append(
        fieldLabel,
        createNumberInput(label, shadow[key], options, (event, value) =>
          this.#updateShadow(index, { [key]: value }, event.type, event),
        ),
      );
      content.append(field);
    };
    appendNumberField("Blur", "blur", {
      min: 0,
      iconName: "adjust",
      disabled,
    });
    if (shadow.type !== "text") {
      appendNumberField("Spread", "spread", { iconName: "sun", disabled });
    }

    const colorField = document.createElement("fig-field");
    const colorLabel = document.createElement("label");
    colorLabel.textContent = "Color";
    const colorInput = document.createElement("fig-input-color");
    colorInput.setAttribute("value", shadow.color);
    colorInput.setAttribute("text", "true");
    colorInput.setAttribute("alpha", "true");
    colorInput.setAttribute("full", "");
    colorInput.setAttribute("aria-label", "Shadow color");
    if (disabled) colorInput.setAttribute("disabled", "");
    const updateColor = (event) => {
      event.stopPropagation();
      this.#updateShadow(
        index,
        { color: colorValue(event, colorInput, shadow.color) },
        event.type,
        event,
      );
    };
    colorInput.addEventListener("input", updateColor);
    colorInput.addEventListener("change", updateColor);
    colorField.append(colorLabel, colorInput);
    content.append(colorField);
    popup.append(content);

    popup.addEventListener("close", () => {
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("selected");
    });
    return popup;
  }

  #render() {
    const disabled =
      this.hasAttribute("disabled") && this.getAttribute("disabled") !== "false";
    const group = document.createElement("fig-group");
    group.setAttribute("compact", "");
    group.className = "shadows-group";

    const header = document.createElement("fig-header");
    header.setAttribute("borderless", "");
    const title = document.createElement("h3");
    title.textContent = this.getAttribute("label") || "Shadows";
    header.append(title);

    const menu = document.createElement("fig-menu");
    menu.setAttribute("position", "bottom right");
    const add = createIconButton("Add shadow", "add");
    add.setAttribute("fig-menu-trigger", "");
    if (disabled || (!this.multiple && this.#shadows.length > 0)) {
      add.setAttribute("disabled", "");
    }
    menu.append(add);
    Object.entries(SHADOW_TYPES).forEach(([type, definition]) => {
      const item = document.createElement("fig-menu-item");
      item.setAttribute("value", type);
      item.textContent = definition.label;
      menu.append(item);
    });
    menu.addEventListener("change", (event) => {
      event.stopPropagation();
      const type = String(event.detail?.value ?? "");
      if (
        !Object.prototype.hasOwnProperty.call(SHADOW_TYPES, type) ||
        (!this.multiple && this.#shadows.length > 0)
      ) {
        return;
      }
      const shadow = defaultShadow(type);
      const index = this.#shadows.length;
      this.#replaceShadows(
        [...this.#shadows, shadow],
        "change",
        { action: "add", index, value: clone(shadow) },
      );
      this.#openEditor(index);
    });
    header.append(menu);
    group.append(header);

    const reorder = document.createElement("fig-reorder");
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
      const shadows = [...this.#shadows];
      const [moved] = shadows.splice(oldIndex, 1);
      if (!moved) return;
      shadows.splice(newIndex, 0, moved);
      this.#replaceShadows(shadows, "change", {
        action: "reorder",
        oldIndex,
        newIndex,
      });
    });

    this.#shadows.forEach((shadow, index) => {
      const property = document.createElement("fig-property");
      property.setAttribute("aria-label", SHADOW_TYPES[shadow.type].label);
      property.setAttribute("show-trailing", "");
      if (this.#shadows.length > 1) property.setAttribute("leading", "drag");

      const trigger = document.createElement("fig-button");
      trigger.id = figEditorUniqueId();
      trigger.setAttribute("slot", "input");
      trigger.setAttribute("variant", "property");
      trigger.setAttribute("full", "");
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-expanded", "false");
      if (disabled || !shadow.visible) trigger.setAttribute("disabled", "");
      trigger.textContent = SHADOW_TYPES[shadow.type].label;
      trigger.addEventListener("click", () => {
        const popup = property.querySelector(`#${trigger.getAttribute("aria-controls")}`);
        if (!popup) return;
        popup.open = !popup.open;
        trigger.setAttribute("aria-expanded", String(popup.open));
        trigger.toggleAttribute("selected", popup.open);
      });
      property.append(trigger);

      const actions = document.createElement("fig-stack");
      actions.setAttribute("slot", "trailing");
      actions.setAttribute("gap", "1");
      const visibility = createIconButton(
        shadow.visible ? "Hide shadow" : "Show shadow",
        shadow.visible ? "visible" : "hidden",
      );
      visibility.toggleAttribute("selected", !shadow.visible);
      if (disabled) visibility.setAttribute("disabled", "");
      visibility.addEventListener("click", () => {
        this.#updateShadow(
          index,
          { visible: !shadow.visible },
          "change",
          null,
          true,
        );
      });
      const remove = createIconButton("Remove shadow", "minus");
      if (disabled) remove.setAttribute("disabled", "");
      remove.addEventListener("click", () => {
        this.#replaceShadows(
          this.#shadows.filter((_, candidateIndex) => candidateIndex !== index),
          "change",
          { action: "remove", index },
        );
      });
      actions.append(visibility, remove);
      property.append(actions);

      const popup = this.#createEditor(shadow, index, trigger, disabled);
      trigger.setAttribute("aria-controls", popup.id);
      property.append(popup);
      reorder.append(property);
    });

    group.append(reorder);
    this.replaceChildren(group);
  }
}

figEditorDefineElement("fig-module-shadows", FigModuleShadows);

export {
  FigModuleShadows,
  FigModuleShadows as FigShadowModule,
  shadowValues as figShadowModuleValues,
};
