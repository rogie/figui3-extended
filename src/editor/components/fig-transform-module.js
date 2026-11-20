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
  figEditorWithTooltip,
} from "../runtime/helpers.js";

const TRANSFORM_TYPES = {
  translate: {
    label: "Translate",
    defaults: { x: 0, y: 0, z: 0 },
    fields: [
      ["x", "X", "px"],
      ["y", "Y", "px"],
      ["z", "Z", "px"],
    ],
  },
  rotate: {
    label: "Rotate",
    defaults: { x: 0, y: 0, z: 0 },
    fields: [
      ["x", "X rotation", "°"],
      ["y", "Y rotation", "°"],
      ["z", "Z rotation", "°"],
    ],
  },
  scale: {
    label: "Scale",
    defaults: { x: 1, y: 1, z: 1 },
    fields: [
      ["x", "X scale", "%"],
      ["y", "Y scale", "%"],
      ["z", "Z scale", "%"],
    ],
  },
  skew: {
    label: "Skew",
    defaults: { x: 0, y: 0 },
    fields: [
      ["x", "X skew", "°"],
      ["y", "Y skew", "°"],
    ],
  },
  perspective: {
    label: "Perspective",
    defaults: { depth: 1000 },
    fields: [["depth", "Depth", "px"]],
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeTransform(transform) {
  if (!transform || typeof transform !== "object") return null;
  const type = Object.prototype.hasOwnProperty.call(
    TRANSFORM_TYPES,
    transform.type,
  )
    ? transform.type
    : "translate";
  const definition = TRANSFORM_TYPES[type];
  const normalized = {
    ...clone(definition.defaults),
    ...clone(transform),
    type,
    visible: transform.visible !== false,
  };
  for (const key of Object.keys(definition.defaults)) {
    normalized[key] = number(transform[key], definition.defaults[key]);
  }
  if (type === "perspective") {
    normalized.depth = Math.max(1, normalized.depth);
  }
  return normalized;
}

function parseTransforms(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeTransform).filter(Boolean);
  } catch {
    return [];
  }
}

function defaultTransform(type = "translate") {
  return normalizeTransform({ type });
}

function transformCss(transform) {
  switch (transform.type) {
    case "rotate":
      return [
        `rotateX(${transform.x}deg)`,
        `rotateY(${transform.y}deg)`,
        `rotateZ(${transform.z}deg)`,
      ].join(" ");
    case "scale":
      return `scale3d(${transform.x}, ${transform.y}, ${transform.z})`;
    case "skew":
      return `skew(${transform.x}deg, ${transform.y}deg)`;
    case "perspective":
      return `perspective(${transform.depth}px)`;
    default:
      return `translate3d(${transform.x}px, ${transform.y}px, ${transform.z}px)`;
  }
}

function transformValues(transforms) {
  const transform = transforms
    .filter((entry) => entry.visible)
    .map(transformCss)
    .join(" ");
  return { transform: transform || "none" };
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

/**
 * Hydratable, ordered transform property module.
 *
 * @element fig-module-transforms
 * @attr {string} transforms - JSON array of transform objects
 * @attr {boolean} multiple - Set to "false" for a single transform
 */
class FigModuleTransforms extends HTMLElement {
  #transforms = [];
  #reflecting = false;

  static get observedAttributes() {
    return ["transforms", "label", "multiple", "disabled"];
  }

  get transforms() {
    return clone(this.#transforms);
  }

  set transforms(value) {
    this.setAttribute(
      "transforms",
      typeof value === "string" ? value : JSON.stringify(value ?? []),
    );
  }

  get values() {
    return transformValues(this.#transforms);
  }

  get multiple() {
    return this.getAttribute("multiple") !== "false";
  }

  set multiple(value) {
    this.setAttribute("multiple", value ? "true" : "false");
  }

  connectedCallback() {
    this.classList.add("fig-module");
    if (this.hasAttribute("transforms")) {
      this.#transforms = parseTransforms(this.getAttribute("transforms"));
    } else {
      this.#transforms = [defaultTransform()];
      this.#reflect();
    }
    this.#render();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected || this.#reflecting) return;
    if (name === "transforms") {
      this.#transforms = parseTransforms(this.getAttribute("transforms"));
    }
    this.#render();
  }

  #reflect() {
    this.#reflecting = true;
    this.setAttribute("transforms", JSON.stringify(this.#transforms));
    this.#reflecting = false;
  }

  #emit(type, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        detail: {
          transforms: this.transforms,
          values: this.values,
          phase: type,
          path: "transforms",
          ...detail,
        },
      }),
    );
  }

  #replaceTransforms(transforms, type, detail, render = true) {
    this.#transforms = transforms;
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

  #updateTransform(index, patch, phase, sourceEvent, render = false) {
    sourceEvent?.stopPropagation();
    const next = normalizeTransform({
      ...this.#transforms[index],
      ...patch,
    });
    if (!next) return;
    const transforms = this.#transforms.map((transform, candidateIndex) =>
      candidateIndex === index ? next : transform,
    );
    this.#replaceTransforms(
      transforms,
      phase,
      { index, path: `transforms.${index}`, value: clone(next) },
      render,
    );
  }

  #createNumberInput(transform, index, key, label, units, disabled) {
    const input = document.createElement("fig-input-number");
    // Scale stays a unitless factor in the public API and CSS output.
    const displayFactor = transform.type === "scale" ? 100 : 1;
    input.setAttribute("value", String(transform[key] * displayFactor));
    input.setAttribute("default", String(TRANSFORM_TYPES[transform.type].defaults[key] * displayFactor));
    input.setAttribute("step", "1");
    input.setAttribute("full", "");
    input.setAttribute("aria-label", label);
    if (units) input.setAttribute("units", units);
    input.setAttribute("units-disallow", "");
    if (transform.type === "perspective") input.setAttribute("min", "1");
    if (disabled) input.setAttribute("disabled", "");
    if (key !== "depth") {
      const prepend = document.createElement("fig-icon");
      prepend.setAttribute("slot", "prepend");
      prepend.textContent = key.toUpperCase();
      input.append(prepend);
    }
    const update = (event) => {
      event.stopPropagation();
      this.#updateTransform(
        index,
        {
          [key]: number(eventValue(event, input), transform[key] * displayFactor) /
            displayFactor,
        },
        event.type,
        event,
      );
    };
    input.addEventListener("input", update);
    input.addEventListener("change", update);
    return input;
  }

  #createEditor(transform, index, trigger, disabled) {
    const popup = document.createElement("dialog", { is: "fig-popup" });
    popup.setAttribute("is", "fig-popup");
    // FigUI3 promotes popovers to the top layer, beyond scrolling ancestors.
    popup.setAttribute("popover", "manual");
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
    typeSelect.setAttribute("value", transform.type);
    typeSelect.setAttribute("label", "Transform type");
    if (disabled) typeSelect.setAttribute("disabled", "");
    const options = document.createElement("fig-select-options");
    options.setAttribute("slot", "panel");
    Object.entries(TRANSFORM_TYPES).forEach(([type, definition]) => {
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
      if (!Object.prototype.hasOwnProperty.call(TRANSFORM_TYPES, type)) return;
      this.#updateTransform(
        index,
        defaultTransform(type),
        "change",
        event,
        true,
      );
      this.#openEditor(index);
    });
    const close = createIconButton("Close transform editor", "close");
    close.setAttribute("close-dialog", "");
    header.append(typeSelect, close);
    popup.append(header);
    popup.setAttribute("title", TRANSFORM_TYPES[transform.type].label);
    popup.addEventListener("fig-popup-lifecycle", (event) => {
      if (event.target !== popup) return;
      const open = event.detail?.state === "opening" ||
        event.detail?.state === "open";
      trigger.setAttribute("aria-expanded", String(open));
      trigger.toggleAttribute("selected", open);
    });

    const content = document.createElement("fig-content");
    if (transform.type === "rotate") {
      content.setAttribute("padding", "");
      const editor = document.createElement("fig-3d-rotate");
      editor.setAttribute("fields", "rotateX,rotateY,rotateZ");
      editor.setAttribute("aspect-ratio", "4/3");
      editor.setAttribute(
        "value",
        `rotateX(${transform.x}deg) rotateY(${transform.y}deg) rotateZ(${transform.z}deg)`,
      );
      editor.setAttribute("default-x", "0");
      editor.setAttribute("default-y", "0");
      editor.setAttribute("default-z", "0");
      if (disabled) editor.setAttribute("disabled", "");
      const update = (event) => {
        const detail = event.detail ?? {};
        this.#updateTransform(
          index,
          {
            x: number(detail.rotateX, transform.x),
            y: number(detail.rotateY, transform.y),
            z: number(detail.rotateZ, transform.z),
          },
          event.type,
          event,
        );
      };
      editor.addEventListener("input", update);
      editor.addEventListener("change", update);
      content.append(editor);
      popup.append(content);
      return popup;
    }

    const field = document.createElement("fig-field");
    const fieldLabel = document.createElement("label");
    fieldLabel.textContent = transform.type === "perspective"
      ? "Depth"
      : TRANSFORM_TYPES[transform.type].label;
    const stack = document.createElement("fig-stack");
    stack.setAttribute("direction", "vertical");
    stack.setAttribute("full", "");
    for (const [key, label, units] of TRANSFORM_TYPES[transform.type].fields) {
      stack.append(
        this.#createNumberInput(
          transform,
          index,
          key,
          label,
          units,
          disabled,
        ),
      );
    }
    field.append(fieldLabel, stack);
    content.append(field);
    popup.append(content);
    return popup;
  }

  #render() {
    const disabled =
      this.hasAttribute("disabled") && this.getAttribute("disabled") !== "false";
    const group = document.createElement("fig-group");
    group.className = "transforms-group";

    const header = document.createElement("fig-header");
    header.setAttribute("borderless", "");
    const title = document.createElement("h3");
    title.textContent = this.getAttribute("label") || "Transforms";
    header.append(title);

    const menu = document.createElement("fig-menu");
    menu.setAttribute("position", "bottom right");
    const add = createIconButton("Add transform", "add");
    add.setAttribute("fig-menu-trigger", "");
    if (disabled || (!this.multiple && this.#transforms.length > 0)) {
      add.setAttribute("disabled", "");
    }
    menu.append(add);
    Object.entries(TRANSFORM_TYPES).forEach(([type, definition]) => {
      const item = document.createElement("fig-menu-item");
      item.setAttribute("value", type);
      item.textContent = definition.label;
      menu.append(item);
    });
    menu.addEventListener("change", (event) => {
      event.stopPropagation();
      const type = String(event.detail?.value ?? "");
      if (
        !Object.prototype.hasOwnProperty.call(TRANSFORM_TYPES, type) ||
        (!this.multiple && this.#transforms.length > 0)
      ) {
        return;
      }
      const transform = defaultTransform(type);
      const index = this.#transforms.length;
      this.#replaceTransforms(
        [...this.#transforms, transform],
        "change",
        {
          action: "add",
          index,
          value: clone(transform),
        },
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
      const oldIndex = event.detail?.oldIndex ?? event.detail?.from;
      const newIndex = event.detail?.newIndex ?? event.detail?.to;
      if (
        typeof oldIndex !== "number" ||
        typeof newIndex !== "number" ||
        oldIndex === newIndex
      ) {
        return;
      }
      const transforms = [...this.#transforms];
      const [moved] = transforms.splice(oldIndex, 1);
      if (!moved) return;
      transforms.splice(newIndex, 0, moved);
      this.#replaceTransforms(transforms, "change", {
        action: "reorder",
        oldIndex,
        newIndex,
      });
    });

    this.#transforms.forEach((transform, index) => {
      const property = document.createElement("fig-property");
      property.setAttribute(
        "aria-label",
        TRANSFORM_TYPES[transform.type].label,
      );
      property.setAttribute("show-trailing", "");
      if (this.#transforms.length > 1) property.setAttribute("leading", "drag");

      const trigger = document.createElement("fig-button");
      trigger.id = figEditorUniqueId();
      trigger.setAttribute("slot", "input");
      trigger.setAttribute("variant", "property");
      trigger.setAttribute("full", "");
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-expanded", "false");
      if (disabled || !transform.visible) trigger.setAttribute("disabled", "");
      trigger.textContent = TRANSFORM_TYPES[transform.type].label;
      trigger.addEventListener("click", () => {
        const popup = property.querySelector(
          `#${trigger.getAttribute("aria-controls")}`,
        );
        if (!popup) return;
        popup.open = !popup.open;
      });
      property.append(trigger);

      const actions = document.createElement("fig-stack");
      actions.setAttribute("slot", "trailing");
      actions.setAttribute("gap", "1");
      const visibility = createIconButton(
        transform.visible ? "Hide transform" : "Show transform",
        transform.visible ? "visible" : "hidden",
      );
      visibility.toggleAttribute("selected", !transform.visible);
      if (disabled) visibility.setAttribute("disabled", "");
      visibility.addEventListener("click", () => {
        this.#updateTransform(
          index,
          { visible: !transform.visible },
          "change",
          null,
          true,
        );
      });
      const remove = createIconButton("Remove transform", "minus");
      if (disabled) remove.setAttribute("disabled", "");
      remove.addEventListener("click", () => {
        this.#replaceTransforms(
          this.#transforms.filter(
            (_, candidateIndex) => candidateIndex !== index,
          ),
          "change",
          { action: "remove", index },
        );
      });
      actions.append(
        figEditorWithTooltip(
          transform.visible ? "Hide transform" : "Show transform",
          visibility,
        ),
        figEditorWithTooltip("Remove transform", remove),
      );
      property.append(actions);

      const popup = this.#createEditor(transform, index, trigger, disabled);
      trigger.setAttribute("aria-controls", popup.id);
      property.append(popup);
      reorder.append(property);
    });

    if (this.#transforms.length > 0) group.append(reorder);
    this.replaceChildren(group);
    queueMicrotask(() => {
      if (reorder.isConnected) reorder.refresh();
    });
  }
}

figEditorDefineElement("fig-module-transforms", FigModuleTransforms);

export {
  FigModuleTransforms,
  FigModuleTransforms as FigTransformModule,
  transformValues as figTransformModuleValues,
};
