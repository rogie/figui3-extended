/*
PolyForm Shield License 1.0.0
https://polyformproject.org/licenses/shield/1.0.0
Required Notice: Copyright (c) 2026 Rogie King
Licensor Line of Business: FigUI3 editor and lab (Figma-style plugin UI kit)
*/
import {
  HTMLElement,
  CustomEvent,
  figEditorBooleanAttribute,
  figEditorCreateElement,
  figEditorCreateIcon,
  figEditorDefineElement,
  figEditorUniqueId,
} from "../runtime/helpers.js";
import {
  applyFontPickerCss,
  fontCapabilities,
  fontPickerCss,
  genericFontFamilies,
  googleFontsStylesheetUrl,
  mergeFontFamilies,
  normalizeFontFamily,
  normalizeFontOptions,
  normalizeFontPickerValue,
  parseOpenTypeFont,
  serializeFontPickerValue,
} from "../runtime/fonts.js";
import { GOOGLE_FONTS_CATALOG } from "../data/google-fonts-catalog.js";
import { GOOGLE_FONT_FAMILY_TAGS } from "../data/google-font-family-tags.js";

const FONT_FILTER_OPTIONS = [
  { value: "all", label: "All fonts" },
  { value: "favorites", label: "Favorites" },
  { value: "recent", label: "Recent" },
  { value: "category:serif", label: "Category · Serif" },
  { value: "category:sans-serif", label: "Category · Sans serif" },
  { value: "category:display", label: "Category · Display" },
  { value: "category:handwriting", label: "Category · Handwriting" },
  { value: "category:monospace", label: "Category · Monospace" },
  { value: "capability:variable", label: "Capability · Variable" },
  { value: "capability:static", label: "Capability · Static" },
  { value: "capability:opticalSize", label: "Capability · Optical size" },
  { value: "capability:italic", label: "Capability · Italic" },
  { value: "capability:multipleWeights", label: "Capability · Multiple weights" },
  { value: "subset:latin", label: "Language · Latin" },
  { value: "subset:cyrillic", label: "Language · Cyrillic" },
  { value: "subset:greek", label: "Language · Greek" },
  { value: "source:provided", label: "Source · Provided" },
  { value: "source:local", label: "Source · Local" },
  { value: "source:web", label: "Source · Web" },
  { value: "source:google", label: "Source · Google" },
  { value: "source:generic", label: "Source · Generic" },
];
const FONT_FAVORITES_STORAGE_KEY = "figui3:font-favorites";
const FONT_FAVORITES_ONLY_STORAGE_KEY = "figui3:font-favorites-only";
const MAX_FIG_PREVIEW_FONT_FACES = 24;
const FIG_FONT_FACES = new Map();
const FIG_MANAGED_FONT_FACES = new WeakSet();

function loadFigFontFace(
  family,
  src,
  descriptors = {},
  persistent = false,
) {
  if (
    !family ||
    !src ||
    typeof FontFace !== "function" ||
    !document.fonts?.add
  ) {
    return Promise.resolve(false);
  }
  const normalizedDescriptors = {
    style: descriptors.style || "normal",
    weight: String(descriptors.weight || 400),
    ...(descriptors.stretch
      ? { stretch: String(descriptors.stretch) }
      : {}),
  };
  const key = JSON.stringify({
    family: family.toLocaleLowerCase(),
    src,
    ...normalizedDescriptors,
  });
  let entry = FIG_FONT_FACES.get(key);
  if (entry) {
    if (persistent) entry.persistent = true;
    FIG_FONT_FACES.delete(key);
    FIG_FONT_FACES.set(key, entry);
  } else {
    const face = new FontFace(
      family,
      `url(${JSON.stringify(src)})`,
      normalizedDescriptors,
    );
    FIG_MANAGED_FONT_FACES.add(face);
    document.fonts.add(face);
    entry = { face, persistent };
    entry.promise = face
      .load()
      .then(() => true)
      .catch(() => {
        document.fonts.delete(face);
        if (FIG_FONT_FACES.get(key) === entry) {
          FIG_FONT_FACES.delete(key);
        }
        return false;
      });
    FIG_FONT_FACES.set(key, entry);
    let previewCount = [...FIG_FONT_FACES.values()].filter(
      (candidate) => !candidate.persistent,
    ).length;
    while (previewCount > MAX_FIG_PREVIEW_FONT_FACES) {
      const oldestKey = [...FIG_FONT_FACES].find(
        ([, candidate]) => !candidate.persistent,
      )?.[0];
      if (oldestKey === undefined) break;
      const oldest = FIG_FONT_FACES.get(oldestKey);
      FIG_FONT_FACES.delete(oldestKey);
      document.fonts.delete(oldest.face);
      previewCount -= 1;
    }
  }
  return entry.promise;
}

function readFontFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(FONT_FAVORITES_STORAGE_KEY) || "[]");
    return new Set(
      Array.isArray(value)
        ? value.map((family) => String(family).toLocaleLowerCase())
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeFontFavorites(favorites) {
  try {
    localStorage.setItem(
      FONT_FAVORITES_STORAGE_KEY,
      JSON.stringify([...favorites]),
    );
  } catch {
    // Storage can be unavailable in sandboxed or privacy-restricted contexts.
  }
}

function readFontFavoritesOnly() {
  try {
    return localStorage.getItem(FONT_FAVORITES_ONLY_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeFontFavoritesOnly(favoritesOnly) {
  try {
    localStorage.setItem(
      FONT_FAVORITES_ONLY_STORAGE_KEY,
      String(Boolean(favoritesOnly)),
    );
  } catch {
    // Storage can be unavailable in sandboxed or privacy-restricted contexts.
  }
}

function cleanFamily(value) {
  return String(value ?? "")
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2");
}

function faceKey(family, face) {
  return `${String(family).toLocaleLowerCase()}\0${String(face?.id).toLocaleLowerCase()}`;
}

function createFigPopup() {
  let dialog;
  try {
    dialog = document.createElement("dialog", { is: "fig-popup" });
  } catch {
    dialog = document.createElement("dialog");
  }
  dialog.setAttribute("is", "fig-popup");
  return dialog;
}

function cssUrl(source) {
  const match = String(source || "").match(/url\(\s*(?:(["'])(.*?)\1|([^)]*))\s*\)/i);
  return match ? (match[2] || match[3] || "").trim() : "";
}

function fontPickerUiFamily(value) {
  const family = fontPickerCss(value).fontFamily;
  const fallback = "var(--fig-font-family, system-ui, sans-serif)";
  return family === "unset" ? fallback : `${family}, ${fallback}`;
}

function applyFontPickerUiCss(element, value) {
  applyFontPickerCss(element, value);
  if (element) element.style.fontFamily = fontPickerUiFamily(value);
}

function figFontJsonValuesEqual(left, right) {
  return serializeFontPickerValue(left) === serializeFontPickerValue(right);
}

function figFontEmitReset(element) {
  element.dispatchEvent(
    new CustomEvent("reset", {
      bubbles: true,
      composed: true,
      detail: { value: element.value },
    }),
  );
}

function figFontDispatchEvent(element, type, value, detail = {}) {
  element.dispatchEvent(
    new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: { value, ...detail },
    }),
  );
}

/**
 * Searchable family/face picker with progressive local-font discovery.
 *
 * @attr {string} value - Font family name or serialized { family, face?, axes } value. Empty or "unset" clears the family.
 * @attr {string} default - Default font family name or serialized font value.
 * @attr {string} options - Supplied family/face metadata.
 * @attr {string} preview-text - Editable preview sample.
 * @attr {boolean|string} local-fonts - Set false to skip Local Font Access.
 * @attr {boolean|string} google-fonts - Set false to omit the built-in catalog.
 * @attr {number} google-font-limit - Maximum popular Google families.
 */
export class FigFontPicker extends HTMLElement {
  anchorElement = null;

  static observedAttributes = [
    "label",
    "aria-label",
    "aria-describedby",
    "value",
    "default",
    "options",
    "preview-text",
    "minimal",
    "local-fonts",
    "dialog-position",
    "dialog-offset",
    "google-fonts",
    "google-font-limit",
    "disabled",
  ];

  #surface = null;
  #trigger = null;
  #dialog = null;
  #header = null;
  #toolbar = null;
  #search = null;
  #favoritesOnlyButton = null;
  #sourceSelect = null;
  #tabs = null;
  #favoritesTab = null;
  #fontList = null;
  #favoritesList = null;
  #fontsPanel = null;
  #favoritesPanel = null;
  #list = null;
  #status = null;
  #initialValue = null;
  #reflecting = false;
  #eventValue = undefined;
  #families = [];
  #providedFamilies = [];
  #webFamilies = [];
  #localFamilies = [];
  #googleFamilies = [];
  #favorites = new Set();
  #favoritesLoaded = false;
  #favoritesOnly = false;
  #favoritesOnlyLoaded = false;
  #loaders = new Map();
  #inspectionCache = new Map();
  #inspected = new Set();
  #query = "";
  #source = "all";
  #fontSource = "all";
  #recent = [];
  #activeTab = "fonts";
  #localStatus = "idle";
  #previewText = "Aa";
  #fontSet = null;
  #fontPreviewObserver = null;
  #selectedFontLoadKey = null;
  #valueAtOpen = null;
  #lastChangeValue = null;
  #boundTriggerClick = this.#handleTriggerClick.bind(this);
  #boundTriggerKeydown = this.#handleTriggerKeydown.bind(this);
  #boundTriggerValueEvent = (event) => {
    if (event.target === this.#trigger) event.stopImmediatePropagation();
  };
  #boundDialogLifecycle = (event) => {
    if (event.target === this.#dialog && event.detail?.state === "closed") {
      this.#handleDialogClose();
    }
  };
  #boundSearchInput = this.#handleSearchInput.bind(this);
  #boundFavoritesOnlyClick = this.#handleFavoritesOnlyClick.bind(this);
  #boundSourceChange = this.#handleSourceChange.bind(this);
  #boundTabsChange = this.#handleTabsChange.bind(this);
  #boundListClick = this.#handleListClick.bind(this);
  #boundListSelection = this.#handleListSelection.bind(this);
  #boundListPointerOver = this.#handleListPointerOver.bind(this);
  #boundListFocusIn = this.#handleListFocusIn.bind(this);
  #boundListKeydown = this.#handleListKeydown.bind(this);
  #boundFontsLoaded = (event) => {
    if (
      event?.fontfaces?.length &&
      [...event.fontfaces].every((face) =>
        FIG_MANAGED_FONT_FACES.has(face),
      )
    ) {
      return;
    }
    this.refreshFonts();
  };

  connectedCallback() {
    this.toggleAttribute("data-fig-control", true);
    if (!this.#favoritesLoaded) {
      this.#favorites = readFontFavorites();
      this.#favoritesLoaded = true;
    }
    if (!this.#favoritesOnlyLoaded) {
      this.#favoritesOnly = readFontFavoritesOnly();
      this.#favoritesOnlyLoaded = true;
    }
    if (!this.#surface) this.#initialize();
    if (!this.#initialValue) {
      this.#initialValue = normalizeFontPickerValue(
        this.getAttribute("value") ?? this.getAttribute("default") ?? "unset",
      );
      this.#reflectValue(this.#initialValue);
    }
    this.#syncSurface();
    this.#syncPresentation();
    this.#bindEvents();
    this.#fontSet = document.fonts || null;
    this.#fontSet?.addEventListener?.("loadingdone", this.#boundFontsLoaded);
    this.refreshFonts();
  }

  disconnectedCallback() {
    this.#unbindEvents();
    this.#fontSet?.removeEventListener?.("loadingdone", this.#boundFontsLoaded);
    this.#fontSet = null;
    this.#fontPreviewObserver?.disconnect();
    this.#fontPreviewObserver = null;
    this.#selectedFontLoadKey = null;
    this.removeAttribute("data-font-loading");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.#surface) return;
    if (
      name === "label" ||
      name === "aria-label" ||
      name === "aria-describedby"
    ) {
      this.#syncSurface();
    } else if (name === "value" && !this.#reflecting) {
      const value = this.#reflectValue(
        normalizeFontPickerValue(newValue ?? ""),
      );
      if (this.#dialog?.open) {
        this.#lastChangeValue = serializeFontPickerValue(value);
      }
      this.#syncPresentation();
      this.#syncListSelection();
    } else if (name === "options") {
      this.refreshFonts();
    } else if (name === "preview-text") {
      this.#previewText = newValue ?? "Aa";
      this.#renderList();
    } else if (name === "minimal") {
      this.#syncMinimalMode();
    } else if (name === "local-fonts" && newValue === "false") {
      this.#localFamilies = [];
      this.#localStatus = "idle";
      this.#mergeFamilies();
    } else if (name === "dialog-position" || name === "dialog-offset") {
      this.#syncDialogPosition();
    } else if (name === "google-fonts" || name === "google-font-limit") {
      this.refreshFonts();
    } else if (name === "disabled") {
      this.#syncPresentation();
    }
  }

  #initialize() {
    const surface = figEditorCreateElement("div", {
      className: "fig-font-picker-surface",
    });
    const trigger = document.createElement("fig-select");
    surface.append(trigger);
    trigger.menuAnchor = surface;

    const dialog = createFigPopup();
    dialog.className = "fig-font-picker-dialog";
    dialog.id = figEditorUniqueId();
    dialog.setAttribute("drag", "true");
    dialog.setAttribute("handle", ".fig-font-picker-header");
    dialog.setAttribute("autoresize", "false");
    dialog.setAttribute("popover", "manual");
    dialog.setAttribute("viewport-margin", "8");
    dialog.setAttribute("closedby", "any");
    dialog.setAttribute("aria-label", "Font picker");
    const fontsPanelId = figEditorUniqueId();
    const favoritesPanelId = figEditorUniqueId();
    const tabs = figEditorCreateElement("fig-tabs", {
      className: "fig-font-picker-tabs",
      value: "fonts",
      "aria-label": "Font collections",
    });
    const fontsTab = figEditorCreateElement(
      "fig-tab",
      {
        value: "fonts",
        content: `#${fontsPanelId}`,
        selected: true,
      },
      "Fonts",
    );
    const favoritesTab = figEditorCreateElement(
      "fig-tab",
      {
        value: "favorites",
        content: `#${favoritesPanelId}`,
      },
      "Favorites",
    );
    tabs.append(fontsTab);
    const closeButton = figEditorCreateElement(
      "fig-button",
      {
        className: "fig-font-picker-close",
        variant: "ghost",
        type: "button",
        icon: true,
        "aria-label": "Close font picker",
      },
      figEditorCreateIcon("close"),
    );
    const header = figEditorCreateElement(
      "fig-header",
      {
        className: "fig-font-picker-header",
        "data-fig-dialog-header": true,
      },
      [
        tabs,
        figEditorCreateElement(
          "fig-tooltip",
          { text: "Close" },
          closeButton,
        ),
      ],
    );

    const content = figEditorCreateElement("main", {
      className: "fig-font-picker-content",
      "data-fig-overlay-content": true,
    });
    const toolbar = figEditorCreateElement("fig-header", {
      className: "fig-font-picker-toolbar",
      borderless: true,
    });
    const search = figEditorCreateElement(
      "fig-input-text",
      {
        className: "fig-font-picker-search",
        type: "search",
        full: true,
        placeholder: "Find font",
        "aria-label": "Search fonts",
      },
    );
    const favoritesOnlyButton = figEditorCreateElement(
      "fig-button",
      {
        className: "fig-font-picker-favorites-only",
        type: "button",
        variant: "ghost",
        icon: true,
        "aria-label": "Show favorites only",
        "aria-pressed": "false",
      },
      figEditorCreateIcon("save", {
        className: "fig-font-picker-favorite-icon",
      }),
    );
    const sourceSelect = document.createElement("fig-select");
    sourceSelect.className = "fig-font-picker-source";
    sourceSelect.setAttribute("value", "all");
    sourceSelect.setAttribute("full", "");
    sourceSelect.setAttribute("label", "Filters");
    sourceSelect.setAttribute(
      "options",
      JSON.stringify(
        FONT_FILTER_OPTIONS,
      ),
    );
    toolbar.append(search);

    const status = figEditorCreateElement("div", {
      className: "fig-font-picker-status",
      role: "status",
      "aria-live": "polite",
    });
    const createList = (label) =>
      figEditorCreateElement("fig-chooser", {
        className: "fig-font-picker-list",
        items: "fig-button[data-font-option-id]",
        columns: "1",
        overflow: "scrollbar",
        "auto-scroll": "false",
        "scroll-behavior": "auto",
        "aria-label": label,
      });
    const fontList = createList("Fonts");
    const favoritesList = createList("Favorite fonts");
    const fontsPanel = figEditorCreateElement(
      "fig-tab-content",
      {
        id: fontsPanelId,
        className: "fig-font-picker-panel",
      },
      fontList,
    );
    const favoritesPanel = figEditorCreateElement(
      "fig-tab-content",
      {
        id: favoritesPanelId,
        className: "fig-font-picker-panel",
      },
      favoritesList,
    );
    favoritesPanel.style.display = "none";
    const panels = figEditorCreateElement(
      "div",
      { className: "fig-font-picker-panels" },
      [fontsPanel, favoritesPanel],
    );
    content.append(status, panels);
    dialog.append(toolbar, content);

    this.#surface = surface;
    this.#trigger = trigger;
    this.#dialog = dialog;
    this.#header = header;
    this.#toolbar = toolbar;
    this.#search = search;
    this.#favoritesOnlyButton = favoritesOnlyButton;
    this.#sourceSelect = sourceSelect;
    this.#tabs = tabs;
    this.#favoritesTab = favoritesTab;
    this.#fontList = fontList;
    this.#favoritesList = favoritesList;
    this.#fontsPanel = fontsPanel;
    this.#favoritesPanel = favoritesPanel;
    this.#list = fontList;
    this.#status = status;
    this.#previewText = this.getAttribute("preview-text") ?? "Aa";
    closeButton.addEventListener("click", () => this.close());
    this.replaceChildren(surface, dialog);
    this.#syncMinimalMode();
    this.#syncDialogPosition();
    this.#syncFavoritesTab();
  }

  #bindEvents() {
    this.#unbindEvents();
    this.#surface?.addEventListener("click", this.#boundTriggerClick, true);
    this.#surface?.addEventListener(
      "keydown",
      this.#boundTriggerKeydown,
      true,
    );
    this.#trigger?.addEventListener("input", this.#boundTriggerValueEvent);
    this.#trigger?.addEventListener("change", this.#boundTriggerValueEvent);
    this.#dialog?.addEventListener(
      "fig-popup-lifecycle",
      this.#boundDialogLifecycle,
    );
    this.#search?.addEventListener("input", this.#boundSearchInput);
    this.#favoritesOnlyButton?.addEventListener(
      "click",
      this.#boundFavoritesOnlyClick,
    );
    this.#sourceSelect?.addEventListener("input", this.#boundSourceChange);
    this.#sourceSelect?.addEventListener("change", this.#boundSourceChange);
    this.#tabs?.addEventListener("input", this.#boundTabsChange);
    this.#tabs?.addEventListener("change", this.#boundTabsChange);
    for (const list of [this.#fontList, this.#favoritesList]) {
      list?.addEventListener("click", this.#boundListClick, true);
      list?.addEventListener("input", this.#boundListSelection);
      list?.addEventListener("change", this.#boundListSelection);
      list?.addEventListener("pointerover", this.#boundListPointerOver);
      list?.addEventListener("focusin", this.#boundListFocusIn);
      list?.addEventListener("keydown", this.#boundListKeydown);
    }
  }

  #unbindEvents() {
    this.#surface?.removeEventListener("click", this.#boundTriggerClick, true);
    this.#surface?.removeEventListener(
      "keydown",
      this.#boundTriggerKeydown,
      true,
    );
    this.#trigger?.removeEventListener("input", this.#boundTriggerValueEvent);
    this.#trigger?.removeEventListener("change", this.#boundTriggerValueEvent);
    this.#dialog?.removeEventListener(
      "fig-popup-lifecycle",
      this.#boundDialogLifecycle,
    );
    this.#search?.removeEventListener("input", this.#boundSearchInput);
    this.#favoritesOnlyButton?.removeEventListener(
      "click",
      this.#boundFavoritesOnlyClick,
    );
    this.#sourceSelect?.removeEventListener("input", this.#boundSourceChange);
    this.#sourceSelect?.removeEventListener("change", this.#boundSourceChange);
    this.#tabs?.removeEventListener("input", this.#boundTabsChange);
    this.#tabs?.removeEventListener("change", this.#boundTabsChange);
    for (const list of [this.#fontList, this.#favoritesList]) {
      list?.removeEventListener("click", this.#boundListClick, true);
      list?.removeEventListener("input", this.#boundListSelection);
      list?.removeEventListener("change", this.#boundListSelection);
      list?.removeEventListener("pointerover", this.#boundListPointerOver);
      list?.removeEventListener("focusin", this.#boundListFocusIn);
      list?.removeEventListener("keydown", this.#boundListKeydown);
    }
  }

  #syncSurface() {
    if (!this.#surface || !this.#trigger) return;
    this.#trigger.removeAttribute("variant");
    this.#trigger.removeAttribute("label");
    this.#trigger.setAttribute(
      "aria-label",
      this.getAttribute("aria-label") ||
        this.getAttribute("label") ||
        "Font family",
    );
    this.#trigger.setAttribute("full", "");
    const describedBy = this.getAttribute("aria-describedby");
    if (describedBy) this.#trigger.setAttribute("aria-describedby", describedBy);
    else this.#trigger.removeAttribute("aria-describedby");
    this.#syncTriggerDialogState();
  }

  #syncTriggerDialogState() {
    if (!this.#trigger || !this.#dialog) return;
    const open = Boolean(this.#dialog.open);
    const triggerButton = this.#trigger.shadowRoot?.querySelector(
      '[part="trigger"]',
    );
    this.#trigger.setAttribute("aria-haspopup", "dialog");
    this.#trigger.setAttribute("aria-controls", this.#dialog.id);
    this.#trigger.setAttribute("aria-expanded", String(open));
    triggerButton?.setAttribute("aria-haspopup", "dialog");
    triggerButton?.setAttribute("aria-controls", this.#dialog.id);
    triggerButton?.setAttribute("aria-expanded", String(open));
    this.toggleAttribute("data-fig-popup-open", open);
  }

  #syncDialogPosition() {
    if (!this.#dialog) return;
    this.#dialog.setAttribute(
      "position",
      this.getAttribute("dialog-position") || "bottom left",
    );
    this.#dialog.setAttribute(
      "offset",
      this.getAttribute("dialog-offset") || "0 8",
    );
    this.#dialog.anchor = this.anchorElement || this;
  }

  #syncFavoritesOnlyButton() {
    if (!this.#favoritesOnlyButton) return;
    this.#favoritesOnlyButton.toggleAttribute(
      "selected",
      this.#favoritesOnly,
    );
    this.#favoritesOnlyButton.setAttribute(
      "aria-pressed",
      String(this.#favoritesOnly),
    );
    this.#favoritesOnlyButton.setAttribute(
      "aria-label",
      this.#favoritesOnly ? "Show all fonts" : "Show favorites only",
    );
    this.#favoritesOnlyButton.setAttribute(
      "title",
      this.#favoritesOnly ? "Show all fonts" : "Show favorites only",
    );
    const icon = this.#favoritesOnlyButton.querySelector(
      ".fig-font-picker-favorite-icon",
    );
    icon?.setAttribute("name", this.#favoritesOnly ? "saved" : "save");
  }

  #showFontsPanel() {
    this.#activeTab = "fonts";
    this.#list = this.#fontList;
    if (this.#tabs) this.#tabs.value = "fonts";
    if (this.#fontsPanel) this.#fontsPanel.style.display = "";
    if (this.#favoritesPanel) this.#favoritesPanel.style.display = "none";
  }

  #syncMinimalMode() {
    if (
      !this.#dialog ||
      !this.#header ||
      !this.#toolbar ||
      !this.#sourceSelect ||
      !this.#favoritesOnlyButton
    ) {
      return;
    }

    this.#showFontsPanel();
    this.#fontSource = "all";
    this.#sourceSelect.value = "all";
    this.#sourceSelect.removeAttribute("disabled");
    this.#sourceSelect.removeAttribute("hidden");

    if (this.minimal) {
      this.#toolbar.setAttribute("data-minimal", "");
      this.#header.remove();
      this.#sourceSelect.remove();
      if (this.#favoritesOnlyButton.parentElement !== this.#toolbar) {
        this.#toolbar.append(this.#favoritesOnlyButton);
      }
      this.#source = this.#favoritesOnly ? "favorites" : "all";
    } else {
      this.#toolbar.removeAttribute("data-minimal");
      this.#favoritesOnlyButton.remove();
      if (this.#header.parentElement !== this.#dialog) {
        this.#dialog.insertBefore(this.#header, this.#toolbar);
      }
      if (this.#sourceSelect.parentElement !== this.#toolbar) {
        this.#toolbar.append(this.#sourceSelect);
      }
      this.#source = "all";
    }

    this.#syncFavoritesOnlyButton();
    this.#renderList();
  }

  #syncFavoritesTab() {
    if (!this.#tabs || !this.#favoritesTab) return;
    const availableFamilies = new Set(
      this.#families.map((family) => family.family.toLocaleLowerCase()),
    );
    const hasAvailableFavorites = [...this.#favorites].some((family) =>
      availableFamilies.has(family),
    );
    if (hasAvailableFavorites) {
      if (this.#favoritesTab.parentElement !== this.#tabs) {
        this.#tabs.append(this.#favoritesTab);
      }
      return;
    }
    this.#favoritesTab.remove();
    if (this.#activeTab === "favorites") {
      this.#activeTab = "fonts";
      this.#tabs.value = "fonts";
      this.#list = this.#fontList;
      this.#source = this.#fontSource;
      if (this.#sourceSelect) {
        this.#sourceSelect.value = this.#fontSource;
        this.#sourceSelect.removeAttribute("disabled");
        this.#sourceSelect.removeAttribute("hidden");
      }
    }
  }

  #syncPresentation() {
    const disabled = figEditorBooleanAttribute(this, "disabled");
    this.#trigger?.toggleAttribute("disabled", disabled);
    if (this.#trigger) {
      const value = this.value;
      this.#trigger.setAttribute(
        "options",
        JSON.stringify(
          value.family
            ? [{ value: value.family, label: value.family === "unset" ? "None" : value.family }]
            : [],
        ),
      );
      this.#trigger.value = value.family;
      this.#trigger.style.fontFamily = fontPickerUiFamily(value);
      const triggerButton = this.#trigger.shadowRoot?.querySelector(
        '[part="trigger"]',
      );
      triggerButton?.setAttribute("overflow", "fade");
      applyFontPickerUiCss(
        this.#trigger.shadowRoot?.querySelector('[part="label"]'),
        value,
      );
    }
    this.#loadSelectedFont();
    if (this.#dialog) this.#dialog.inert = disabled;
    if (disabled && this.#dialog?.open) this.close();
  }

  #reflectValue(value) {
    const normalized = normalizeFontPickerValue(value, this.#initialValue);
    const serialized = serializeFontPickerValue(normalized);
    if (this.getAttribute("value") !== serialized) {
      this.#reflecting = true;
      this.setAttribute("value", serialized);
      this.#reflecting = false;
    }
    return normalized;
  }

  #providedFonts() {
    return normalizeFontOptions(this.getAttribute("options") || "[]", "provided");
  }

  #catalogGoogleFonts() {
    if (!this.googleFonts) return [];
    return GOOGLE_FONTS_CATALOG.slice(0, this.googleFontLimit)
      .map((font) =>
        normalizeFontFamily(
          {
            ...font,
            tags: [
              ...(font.tags || []),
              ...(GOOGLE_FONT_FAMILY_TAGS[font.family] || []),
            ],
            source: "google",
            provider: "google-fonts",
            faces: font.faces.map((face) => ({
              ...face,
              provider: "google-fonts",
              axes: font.axes,
            })),
          },
          "google",
        ),
      )
      .filter(Boolean);
  }

  #cssFontFaces() {
    const result = [];
    const visitRules = (rules) => {
      for (const rule of rules || []) {
        if (
          (typeof CSSFontFaceRule !== "undefined" && rule instanceof CSSFontFaceRule) ||
          rule?.type === 5
        ) {
          const family = cleanFamily(rule.style?.getPropertyValue("font-family"));
          if (!family) continue;
          result.push({
            family,
            style: rule.style?.getPropertyValue("font-style") || "normal",
            weight: rule.style?.getPropertyValue("font-weight") || "400",
            stretch: rule.style?.getPropertyValue("font-stretch"),
            src: cssUrl(rule.style?.getPropertyValue("src")),
          });
        } else if (rule?.cssRules) {
          visitRules(rule.cssRules);
        }
      }
    };
    for (const sheet of document.styleSheets || []) {
      try {
        visitRules(sheet.cssRules);
      } catch {
        // Cross-origin stylesheets are intentionally opaque.
      }
    }
    return result;
  }

  #discoverWebFonts() {
    const cssFaces = this.#cssFontFaces();
    const families = [];
    if (document.fonts && typeof document.fonts[Symbol.iterator] === "function") {
      for (const fontFace of document.fonts) {
        if (FIG_MANAGED_FONT_FACES.has(fontFace)) continue;
        if (fontFace.status !== "loaded") continue;
        const family = cleanFamily(fontFace.family);
        if (!family) continue;
        const matchingCss = cssFaces.find(
          (face) =>
            face.family.toLocaleLowerCase() === family.toLocaleLowerCase() &&
            cleanFamily(face.style).toLocaleLowerCase() ===
              cleanFamily(fontFace.style || "normal").toLocaleLowerCase(),
        );
        const option = normalizeFontFamily(
          {
            family,
            source: "web",
            faces: [
              {
                family,
                style: fontFace.style || "Regular",
                weight: fontFace.weight || 400,
                stretch: fontFace.stretch,
                src: matchingCss?.src,
              },
            ],
          },
          "web",
        );
        if (option) families.push(option);
      }
    }
    return mergeFontFamilies(families);
  }

  async #discoverLocalFonts() {
    if (!this.localFonts || typeof globalThis.queryLocalFonts !== "function") {
      this.#localStatus = this.localFonts ? "unsupported" : "disabled";
      return [];
    }
    this.#localStatus = "loading";
    this.#renderStatus();
    try {
      const localFaces = await globalThis.queryLocalFonts();
      const families = [];
      for (const data of localFaces || []) {
        const family = cleanFamily(data.family);
        if (!family) continue;
        const option = normalizeFontFamily(
          {
            family,
            source: "local",
            faces: [
              {
                family,
                fullName: data.fullName,
                postscriptName: data.postscriptName,
                style: data.style || "Regular",
              },
            ],
          },
          "local",
        );
        if (!option) continue;
        const face = option.faces[0];
        if (typeof data.blob === "function") {
          this.#loaders.set(faceKey(family, face), async () => {
            const blob = await data.blob();
            return blob.arrayBuffer();
          });
        }
        families.push(option);
      }
      this.#localStatus = "ready";
      return mergeFontFamilies(families);
    } catch (error) {
      this.#localStatus =
        error?.name === "NotAllowedError" || error?.name === "SecurityError"
          ? "denied"
          : "error";
      return [];
    }
  }

  #registerSourceLoaders(families) {
    for (const family of families) {
      for (const face of family.faces || []) {
        if (!face.src) continue;
        const key = faceKey(family.family, face);
        if (this.#loaders.has(key)) continue;
        this.#loaders.set(key, async () => {
          const response = await fetch(face.src, { mode: "cors" });
          if (!response.ok) throw new Error(`Unable to load font metadata (${response.status})`);
          const length = Number(response.headers.get("content-length"));
          if (Number.isFinite(length) && length > 32 * 1024 * 1024) {
            throw new RangeError("Font metadata source is too large");
          }
          return response.arrayBuffer();
        });
      }
    }
  }

  async refreshFonts(options = {}) {
    this.#providedFamilies = this.#providedFonts();
    this.#webFamilies = this.#discoverWebFonts();
    this.#googleFamilies = this.#catalogGoogleFonts();
    this.#registerSourceLoaders(this.#providedFamilies);
    this.#registerSourceLoaders(this.#webFamilies);
    this.#mergeFamilies();
    if (!options.requestLocal || this.#localStatus === "loading") return this.fonts;
    this.#localFamilies = await this.#discoverLocalFonts();
    if (!this.isConnected) return this.fonts;
    this.#mergeFamilies();
    return this.fonts;
  }

  #mergeFamilies() {
    this.#families = mergeFontFamilies(
      this.#providedFamilies,
      this.#localFamilies,
      this.#webFamilies,
      this.#googleFamilies,
      genericFontFamilies(),
    );
    this.#syncFavoritesTab();
    this.#renderStatus();
    this.#renderList();
    this.#loadSelectedFont();
  }

  #renderStatus() {
    if (!this.#status) return;
    const messages = {
      loading: "Requesting access to local fonts…",
      denied: "Local font access was not granted. Web and provided fonts remain available.",
      unsupported: "This browser cannot enumerate local fonts. Web and provided fonts remain available.",
      error: "Local fonts could not be read. Web and provided fonts remain available.",
    };
    this.#status.textContent = messages[this.#localStatus] || "";
    this.#status.hidden = !this.#status.textContent;
  }

  #visibleFamilies() {
    const query = this.#query.toLocaleLowerCase();
    const families = this.#families.filter((family) => {
      if (query) {
        return [
          family.family,
          family.label,
          family.category,
          ...family.faces.flatMap((face) => [
            face.style,
            face.fullName,
            face.postscriptName,
          ]),
        ]
          .filter(Boolean)
          .some((text) => String(text).toLocaleLowerCase().includes(query));
      }
      if (
        this.#source === "favorites" &&
        !this.#favorites.has(family.family.toLocaleLowerCase())
      ) {
        return false;
      }
      if (
        this.#source === "recent" &&
        !this.#recent.includes(family.family.toLocaleLowerCase())
      ) return false;
      const [filterType, filterValue] = this.#source.split(":");
      if (
        filterType === "source" &&
        !family.sources.includes(filterValue)
      ) return false;
      if (
        filterType === "category" &&
        family.category !== filterValue
      ) return false;
      if (
        filterType === "capability" &&
        !fontCapabilities(family)[filterValue]
      ) return false;
      if (
        filterType === "subset" &&
        !(family.subsets || []).some(
          (subset) => String(subset).toLocaleLowerCase() === filterValue,
        )
      ) return false;
      return true;
    });
    if (!query) {
      return families.sort((left, right) => {
        const leftFavorite = this.#favorites.has(
          left.family.toLocaleLowerCase(),
        );
        const rightFavorite = this.#favorites.has(
          right.family.toLocaleLowerCase(),
        );
        if (leftFavorite !== rightFavorite) return leftFavorite ? -1 : 1;
        const leftRecent = this.#recent.indexOf(
          left.family.toLocaleLowerCase(),
        );
        const rightRecent = this.#recent.indexOf(
          right.family.toLocaleLowerCase(),
        );
        if (leftRecent !== rightRecent) {
          if (leftRecent < 0) return 1;
          if (rightRecent < 0) return -1;
          return leftRecent - rightRecent;
        }
        const popularity =
          (left.popularity ?? Number.MAX_SAFE_INTEGER) -
          (right.popularity ?? Number.MAX_SAFE_INTEGER);
        return popularity || left.label.localeCompare(right.label);
      });
    }
    return families;
  }

  #valueForFace(family, face) {
    const current = this.value;
    const axes = {};
    for (const axis of face?.axes || []) {
      const requested = current.axes?.[axis.tag];
      if (axis.tag === "opsz" && !Number.isFinite(requested)) continue;
      const faceDefault =
        axis.tag === "wght" && Number.isFinite(face?.weight)
          ? face.weight
          : axis.tag === "ital" &&
              face?.style?.toLocaleLowerCase().includes("italic")
            ? 1
            : axis.default;
      axes[axis.tag] = Math.max(
        axis.min,
        Math.min(axis.max, Number.isFinite(requested) ? requested : faceDefault),
      );
    }
    return normalizeFontPickerValue({
      family: family.family,
      ...(face
        ? {
            face: {
              id: face.id,
              style: face.style,
              weight: face.weight,
              stretch: face.stretch,
              fullName: face.fullName,
              postscriptName: face.postscriptName,
            },
          }
        : {}),
      axes,
    });
  }

  #familyValue(family) {
    const currentFace =
      this.value.family.toLocaleLowerCase() === family.family.toLocaleLowerCase()
        ? family.faces.find((face) => face.id === this.value.face?.id)
        : null;
    const regularFace =
      family.faces.find(
        (face) =>
          face.weight === 400 &&
          !face.style.toLocaleLowerCase().includes("italic"),
      ) || family.faces[0];
    return this.#valueForFace(family, currentFace || regularFace);
  }

  #createOptionPreview(family, text, value) {
    const preview = figEditorCreateElement("label", {
      className: "fig-font-picker-option-preview",
      slot: "label",
    });
    preview.textContent = text;
    applyFontPickerUiCss(preview, value);
    if (family.sources?.includes("google")) {
      const face =
        family.faces.find(
          (candidate) =>
            candidate.weight === 400 &&
            !candidate.style.toLocaleLowerCase().includes("italic"),
        ) || family.faces[0];
      const src = family.previewUrl || face?.src;
      if (src) {
        preview.dataset.fontPreviewFamily = family.family;
        preview.dataset.fontPreviewSrc = src;
      }
    }
    return preview;
  }

  #loadFontPreview(preview) {
    const family = preview?.dataset?.fontPreviewFamily;
    const src = preview?.dataset?.fontPreviewSrc;
    if (!family || !src) return;
    loadFigFontFace(family, src).then((loaded) => {
      if (
        !preview.isConnected ||
        preview.dataset.fontPreviewFamily !== family ||
        preview.dataset.fontPreviewSrc !== src
      ) {
        return;
      }
      preview.toggleAttribute("data-font-preview-loaded", loaded);
      preview.toggleAttribute("data-font-preview-error", !loaded);
    });
  }

  #observeFontPreviews() {
    this.#fontPreviewObserver?.disconnect();
    this.#fontPreviewObserver = null;
    if (!this.#dialog?.open || !this.#list) return;
    const previews = [
      ...this.#list.querySelectorAll(
        "[data-font-preview-family][data-font-preview-src]",
      ),
    ];
    if (!previews.length) return;
    if (typeof IntersectionObserver !== "function") {
      previews.forEach((preview) => this.#loadFontPreview(preview));
      return;
    }
    this.#fontPreviewObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          this.#loadFontPreview(entry.target);
        }
      },
      { root: this.#list, rootMargin: "64px 0px" },
    );
    previews.forEach((preview) => this.#fontPreviewObserver.observe(preview));
  }

  #googleFamily(name) {
    return this.#families.find(
      (family) =>
        family.family.toLocaleLowerCase() ===
        String(name || "").toLocaleLowerCase(),
    );
  }

  #renderList() {
    if (!this.#list) return;
    const active = document.activeElement?.dataset?.fontOptionId;
    const fragment = document.createDocumentFragment();
    const visible = this.#visibleFamilies();
    const unsetSelected = this.value.family === "unset";
    const unsetOption = figEditorCreateElement("fig-button", {
      className: "fig-font-picker-unset",
      role: "option",
      variant: "ghost",
      size: "large",
      full: true,
      align: "start",
      tabindex: "-1",
      value: "unset",
      selected: unsetSelected,
      "aria-selected": String(unsetSelected),
      "data-font-option-id": "unset",
    });
    unsetOption.append(
      figEditorCreateIcon("checkmark", {
        slot: "prepend",
        className: "fig-font-picker-selected-icon",
        "aria-hidden": "true",
        size: "small",
      }),
      "None",
    );
    fragment.append(unsetOption);
    for (const family of visible) {
      const familyId = `family:${family.family}`;
      const familySelected =
        this.value.family.toLocaleLowerCase() ===
        family.family.toLocaleLowerCase();
      const option = figEditorCreateElement("fig-button", {
        className: "fig-font-picker-option fig-font-picker-family",
        role: "option",
        variant: "ghost",
        size: "large",
        full: true,
        align: "start",
        tabindex: "-1",
        value: familyId,
        selected: familySelected,
        "aria-selected": String(familySelected),
        "data-font-option-id": familyId,
        "data-family": family.family,
      });
      const familyValue = this.#familyValue(family);
      const preview = this.#createOptionPreview(
        family,
        family.label,
        familyValue,
      );
      const selectedIcon = figEditorCreateIcon("checkmark", {
        size: "small",
        className: "fig-font-picker-selected-icon",
      });
      selectedIcon.setAttribute("slot", "prepend");
      selectedIcon.setAttribute("aria-hidden", "true");
      option.append(selectedIcon, preview);
      const favorite = this.#favorites.has(family.family.toLocaleLowerCase());
      option.append(
        figEditorCreateElement(
          "fig-icon",
          {
            className:
              "fig-font-picker-favorite fig-font-picker-favorite-icon",
            name: favorite ? "saved" : "save",
            size: "small",
            slot: "append",
            tabindex: "-1",
            selected: favorite,
            "aria-label": `${favorite ? "Remove" : "Add"} ${family.label} ${
              favorite ? "from" : "to"
            } favorites`,
            "data-favorite-family": family.family,
          },
        ),
      );
      fragment.append(option);
    }
    if (!visible.length) {
      fragment.append(
        figEditorCreateElement(
          "p",
          { className: "fig-font-picker-empty" },
          "No matching fonts",
        ),
      );
    }
    this.#list.replaceChildren(fragment);
    this.#setListSelection(
      this.#list,
      this.#list.querySelector(
        '[data-font-option-id][aria-selected="true"]',
      ),
    );
    const focusTarget =
      (active &&
        this.#list.querySelector(
          `[data-font-option-id="${globalThis.CSS?.escape ? CSS.escape(active) : active.replaceAll('"', '\\"')}"]`,
        )) ||
      this.#list.querySelector('[role="option"][aria-selected="true"]') ||
      this.#list.querySelector('[role="option"]');
    if (focusTarget) focusTarget.setAttribute("tabindex", "0");
    if (active) {
      const escaped = globalThis.CSS?.escape ? CSS.escape(active) : active.replaceAll('"', '\\"');
      this.#list
        .querySelector(`[data-font-option-id="${escaped}"]`)
        ?.focus({ preventScroll: true });
    }
    this.#observeFontPreviews();
  }

  #syncListSelection() {
    const family = this.value.family.toLocaleLowerCase();
    for (const list of [this.#fontList, this.#favoritesList]) {
      if (!list) continue;
      const option =
        family === "unset" ? list.querySelector('[data-font-option-id="unset"]') :
        [...list.querySelectorAll("[data-font-option-id][data-family]")].find(
          (candidate) =>
            !candidate.dataset.faceId &&
            candidate.dataset.family.toLocaleLowerCase() === family,
        ) || null;
      this.#setListSelection(list, option);
    }
  }

  #setListSelection(list, selectedOption) {
    for (const option of list.querySelectorAll("[data-font-option-id]")) {
      const selected = option === selectedOption;
      option.toggleAttribute("selected", selected);
      option.setAttribute("aria-selected", String(selected));
    }
    if ("selectedChoice" in list) list.selectedChoice = selectedOption;
    else list.selectedItem = selectedOption;
  }

  #selectedListOption(list) {
    return list?.selectedChoice ?? list?.selectedItem ?? null;
  }

  #selectedFamily() {
    return this.#families.find(
      (family) => family.family.toLocaleLowerCase() === this.value.family.toLocaleLowerCase(),
    );
  }

  #selectedFace() {
    const family = this.#selectedFamily();
    if (!family) return null;
    return (
      family.faces.find((face) => face.id === this.value.face?.id) ||
      family.faces[0] ||
      null
    );
  }

  #inspectSelectedFace() {
    const family = this.#selectedFamily();
    const face = this.#selectedFace();
    if (family && face) void this.#inspectFace(family, face);
  }

  #loadSelectedFont() {
    const family = this.#selectedFamily();
    const value = this.value;
    const requestedStyle = value.face?.style?.toLocaleLowerCase();
    const requestedWeight = value.axes?.wght ?? value.face?.weight;
    const face =
      family?.faces.find((candidate) => candidate.id === value.face?.id) ||
      family?.faces.find(
        (candidate) =>
          requestedWeight !== undefined &&
          candidate.weight === requestedWeight &&
          (!requestedStyle ||
            candidate.style.toLocaleLowerCase() === requestedStyle),
      ) ||
      family?.faces.find(
        (candidate) =>
          candidate.weight === 400 &&
          !candidate.style.toLocaleLowerCase().includes("italic"),
      ) ||
      family?.faces[0];
    this.#inspectSelectedFace();
    if (!family || !face?.src) {
      this.#selectedFontLoadKey = null;
      this.removeAttribute("data-font-loading");
      this.removeAttribute("data-font-loaded");
      this.removeAttribute("data-font-load-error");
      return;
    }
    const weightAxis = face.axes?.find((axis) => axis.tag === "wght");
    const widthAxis = face.axes?.find((axis) => axis.tag === "wdth");
    const descriptors = {
      style: face.style.toLocaleLowerCase().includes("italic")
        ? "italic"
        : "normal",
      weight: weightAxis
        ? `${weightAxis.min} ${weightAxis.max}`
        : face.weight,
      ...(widthAxis
        ? { stretch: `${widthAxis.min}% ${widthAxis.max}%` }
        : Number.isFinite(face.stretch)
          ? { stretch: `${face.stretch}%` }
          : {}),
    };
    const key = JSON.stringify({
      family: family.family,
      src: face.src,
      descriptors,
    });
    if (key === this.#selectedFontLoadKey) return;
    this.#selectedFontLoadKey = key;
    this.toggleAttribute("data-font-loading", true);
    this.removeAttribute("data-font-loaded");
    this.removeAttribute("data-font-load-error");
    loadFigFontFace(
      family.family,
      face.src,
      descriptors,
      true,
    ).then((loaded) => {
      if (!this.isConnected || this.#selectedFontLoadKey !== key) return;
      this.removeAttribute("data-font-loading");
      this.toggleAttribute("data-font-loaded", loaded);
      this.toggleAttribute("data-font-load-error", !loaded);
    });
  }

  async #inspectFace(family, face) {
    const key = faceKey(family.family, face);
    if (this.#inspected.has(key)) return;
    const loader = this.#loaders.get(key);
    if (!loader) return;
    let inspection = this.#inspectionCache.get(key);
    if (!inspection) {
      inspection = Promise.resolve()
        .then(loader)
        .then(parseOpenTypeFont)
        .catch(() => ({ axes: [], instances: [] }));
      this.#inspectionCache.set(key, inspection);
    }
    const result = await inspection;
    this.#inspected.add(key);
    if (!this.isConnected) return;
    if (result.axes?.length || result.instances?.length) {
      if (result.axes?.length) face.axes = result.axes;
      face.instances = result.instances || [];
      if (this.#selectedFace()?.id === face.id) {
        const next = this.#valueForFace(family, face);
        this.#reflectValue(next);
        this.#syncPresentation();
        this.dispatchEvent(
          new CustomEvent("fontmetadata", {
            bubbles: true,
            composed: true,
            detail: { family: family.family, face: this.selectedFace },
          }),
        );
      }
    }
  }

  #optionFromElement(element) {
    if (element?.dataset.fontOptionId === "unset") {
      return { family: null, face: null, value: { family: "unset", axes: {} } };
    }
    const family = this.#families.find(
      (entry) =>
        entry.family.toLocaleLowerCase() ===
        String(element?.dataset?.family || "").toLocaleLowerCase(),
    );
    if (!family) return null;
    const face = element.dataset.faceId
      ? family.faces.find((entry) => entry.id === element.dataset.faceId)
      : family.faces.find((entry) => entry.id === this.value.face?.id) ||
        family.faces.find(
          (entry) =>
            entry.weight === 400 &&
            !entry.style.toLocaleLowerCase().includes("italic"),
        ) ||
        family.faces[0];
    return { family, face, value: this.#valueForFace(family, face) };
  }

  #resourceForValue(value) {
    const family = this.#googleFamily(value?.family);
    if (!family) return null;
    const face =
      family.faces.find((candidate) => candidate.id === value.face?.id) ||
      family.faces.find((candidate) => candidate.weight === 400) ||
      family.faces[0];
    const google =
      family.sources?.includes("google") &&
      (!value.face?.id || face?.provider === "google-fonts");
    if (!google && !face?.src) return null;
    const resource = {
      provider: google
        ? "google-fonts"
        : face?.provider || family.sources?.[0] || "provided",
      family: family.family,
      category: family.category,
      popularity: family.popularity,
      face: face
        ? {
            id: face.id,
            style: face.style,
            weight: face.weight,
          }
        : null,
      axes: { ...value.axes },
      ...(face?.src ? { fontUrl: face.src } : {}),
    };
    if (google) resource.stylesheetUrl = googleFontsStylesheetUrl(value);
    return resource;
  }

  #dispatchWithValue(type, value) {
    this.#eventValue = normalizeFontPickerValue(value);
    try {
      figFontDispatchEvent(this, type, this.#eventValue, {
        family: this.#eventValue.family,
        face: this.#eventValue.face,
        axes: { ...this.#eventValue.axes },
        css: fontPickerCss(this.#eventValue),
        resource: this.#resourceForValue(this.#eventValue),
      });
      if (type === "change") {
        this.#lastChangeValue = serializeFontPickerValue(this.#eventValue);
      }
    } finally {
      this.#eventValue = undefined;
    }
  }

  #commitValue(value) {
    const next = this.#reflectValue(value);
    const key = next.family.toLocaleLowerCase();
    if (key !== "unset") this.#recent = [key, ...this.#recent.filter((family) => family !== key)].slice(
      0,
      20,
    );
    this.#syncPresentation();
    this.#syncListSelection();
    this.#inspectSelectedFace();
    for (const type of ["input", "change"]) this.#dispatchWithValue(type, next);
  }

  #handleTriggerClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.open();
  }

  #handleTriggerKeydown(event) {
    if (!["Enter", " ", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    this.open();
  }

  #handleDialogClose() {
    this.#fontPreviewObserver?.disconnect();
    this.#fontPreviewObserver = null;
    const closingValue = serializeFontPickerValue(this.value);
    if (
      !figEditorBooleanAttribute(this, "disabled") &&
      this.#lastChangeValue !== null &&
      this.#lastChangeValue !== closingValue
    ) {
      this.#dispatchWithValue("change", this.value);
    }
    this.#valueAtOpen = null;
    this.#lastChangeValue = null;
    this.#syncTriggerDialogState();
    this.dispatchEvent(
      new CustomEvent("previewend", { bubbles: true, composed: true }),
    );
    this.dispatchEvent(new CustomEvent("close"));
  }

  #handleSearchInput(event) {
    event.stopImmediatePropagation();
    this.#query = String(this.#search?.value ?? event.detail ?? "");
    this.#renderList();
  }

  #handleFavoritesOnlyClick(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!this.minimal) return;
    this.#favoritesOnly = !this.#favoritesOnly;
    this.#favoritesOnlyLoaded = true;
    writeFontFavoritesOnly(this.#favoritesOnly);
    this.#source = this.#favoritesOnly ? "favorites" : "all";
    this.#syncFavoritesOnlyButton();
    this.#renderList();
  }

  #handleSourceChange(event) {
    event.stopImmediatePropagation();
    this.#fontSource = String(this.#sourceSelect?.value || "all");
    if (this.#activeTab === "fonts") {
      this.#source = this.#fontSource;
      this.#renderList();
    }
  }

  #handleTabsChange(event) {
    if (event.target !== this.#tabs) return;
    event.stopImmediatePropagation();
    if (event.type === "input") return;
    this.#activeTab =
      this.#tabs?.value === "favorites" && this.#favorites.size
        ? "favorites"
        : "fonts";
    this.#list =
      this.#activeTab === "favorites"
        ? this.#favoritesList
        : this.#fontList;
    if (this.#fontsPanel) {
      this.#fontsPanel.style.display =
        this.#activeTab === "favorites" ? "none" : "";
    }
    if (this.#favoritesPanel) {
      this.#favoritesPanel.style.display =
        this.#activeTab === "favorites" ? "" : "none";
    }
    this.#source =
      this.#activeTab === "favorites" ? "favorites" : this.#fontSource;
    this.#sourceSelect?.toggleAttribute(
      "disabled",
      this.#activeTab === "favorites",
    );
    this.#sourceSelect?.toggleAttribute(
      "hidden",
      this.#activeTab === "favorites",
    );
    this.#renderList();
  }

  #handleListClick(event) {
    if (!(event.target instanceof Element)) return;
    const favorite = event.target.closest("[data-favorite-family]");
    if (favorite) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.#toggleFavorite(favorite.getAttribute("data-favorite-family"));
      return;
    }
    const option = event.target.closest("[data-font-option-id]");
    const entry = this.#optionFromElement(option);
    if (!entry) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.#commitValue(entry.value);
  }

  #handleListSelection(event) {
    if (event.target !== this.#list) return;
    event.stopImmediatePropagation();
    if (event.type === "input") return;
    const entry = this.#optionFromElement(
      this.#selectedListOption(this.#list),
    );
    if (entry) this.#commitValue(entry.value);
  }

  #toggleFavorite(family) {
    const name = String(family || "").trim();
    if (!name) return;
    const key = name.toLocaleLowerCase();
    const favorite = !this.#favorites.has(key);
    if (favorite) this.#favorites.add(key);
    else this.#favorites.delete(key);
    writeFontFavorites(this.#favorites);
    this.#syncFavoritesTab();
    this.#renderList();
    this.dispatchEvent(
      new CustomEvent("favoriteschange", {
        bubbles: true,
        composed: true,
        detail: {
          family: name,
          favorite,
          favorites: this.favorites,
        },
      }),
    );
  }

  #handleListPointerOver(event) {
    if (!(event.target instanceof Element)) return;
    const option = event.target.closest("[data-font-option-id]");
    if (!option || option.contains(event.relatedTarget)) return;
    const entry = this.#optionFromElement(option);
    if (entry) this.#dispatchWithValue("optionhover", entry.value);
  }

  #handleListFocusIn(event) {
    if (!(event.target instanceof Element)) return;
    const option = event.target.closest("[data-font-option-id]");
    const entry = this.#optionFromElement(option);
    if (entry) this.#dispatchWithValue("optionfocus", entry.value);
  }

  #handleListKeydown(event) {
    if (
      !["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(
        event.key,
      )
    ) {
      return;
    }
    const list = event.currentTarget;
    const options = [
      ...list.querySelectorAll("[data-font-option-id]"),
    ].filter((option) => !figEditorBooleanAttribute(option, "disabled"));
    if (!options.length) return;
    const current = options.findIndex(
      (option) =>
        option === document.activeElement || option.matches(":focus-within"),
    );
    if (event.key === "Enter" || event.key === " ") {
      const option = options[Math.max(0, current)];
      if (!option) return;
      event.preventDefault();
      option.click();
      return;
    }
    event.preventDefault();
    let next = current;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key === "ArrowDown") next = Math.min(options.length - 1, current + 1);
    else if (event.key === "ArrowUp") next = Math.max(0, current - 1);
    options[next]?.focus();
  }

  get minimal() {
    return (
      !this.hasAttribute("minimal") ||
      figEditorBooleanAttribute(this, "minimal")
    );
  }

  set minimal(value) {
    this.setAttribute("minimal", value === false ? "false" : "true");
  }

  get localFonts() {
    return this.getAttribute("local-fonts") !== "false";
  }

  set localFonts(value) {
    this.setAttribute("local-fonts", value === false ? "false" : "true");
  }

  get dialogPosition() {
    return this.getAttribute("dialog-position") || "bottom left";
  }

  set dialogPosition(value) {
    if (value === null || value === undefined || value === "") {
      this.removeAttribute("dialog-position");
    } else {
      this.setAttribute("dialog-position", String(value));
    }
  }

  get dialogOffset() {
    return this.getAttribute("dialog-offset") || "0 8";
  }

  set dialogOffset(value) {
    if (value === null || value === undefined || value === "") {
      this.removeAttribute("dialog-offset");
    } else {
      this.setAttribute("dialog-offset", String(value));
    }
  }

  get googleFonts() {
    return this.getAttribute("google-fonts") !== "false";
  }

  set googleFonts(value) {
    this.setAttribute("google-fonts", value === false ? "false" : "true");
  }

  get googleFontLimit() {
    const rawValue = this.getAttribute("google-font-limit");
    if (rawValue === null || rawValue.trim() === "") {
      return Math.min(100, GOOGLE_FONTS_CATALOG.length);
    }
    const value = Number(rawValue);
    return Number.isFinite(value)
      ? Math.max(1, Math.min(GOOGLE_FONTS_CATALOG.length, Math.round(value)))
      : Math.min(100, GOOGLE_FONTS_CATALOG.length);
  }

  set googleFontLimit(value) {
    if (value === null || value === undefined || value === "") {
      this.removeAttribute("google-font-limit");
    } else {
      this.setAttribute("google-font-limit", String(value));
    }
  }

  get favorites() {
    const labels = new Map(
      this.#families.map((family) => [
        family.family.toLocaleLowerCase(),
        family.family,
      ]),
    );
    return [...this.#favorites].map((family) => labels.get(family) || family);
  }

  set favorites(value) {
    this.#favorites = new Set(
      Array.isArray(value)
        ? value
            .map((family) => String(family).trim().toLocaleLowerCase())
            .filter(Boolean)
        : [],
    );
    this.#favoritesLoaded = true;
    writeFontFavorites(this.#favorites);
    this.#syncFavoritesTab();
    this.#renderList();
  }

  get options() {
    return this.#providedFonts().map((family) => ({
      ...family,
      faces: family.faces.map((face) => ({
        ...face,
        axes: face.axes.map((axis) => ({ ...axis })),
        instances: (face.instances || []).map((instance) => ({
          ...instance,
          coordinates: { ...instance.coordinates },
        })),
      })),
    }));
  }

  set options(value) {
    if (value === null || value === undefined) this.removeAttribute("options");
    else this.setAttribute("options", JSON.stringify(value));
  }

  get fonts() {
    return this.#families.map((family) => ({
      ...family,
      sources: [...family.sources],
      ...(Array.isArray(family.subsets)
        ? { subsets: [...family.subsets] }
        : {}),
      ...(Array.isArray(family.tags) ? { tags: [...family.tags] } : {}),
      faces: family.faces.map((face) => ({
        ...face,
        axes: face.axes.map((axis) => ({ ...axis })),
        instances: (face.instances || []).map((instance) => ({
          ...instance,
          coordinates: { ...instance.coordinates },
        })),
      })),
    }));
  }

  get selectedFace() {
    const face = this.#selectedFace();
    return face
      ? {
          ...face,
          axes: face.axes.map((axis) => ({ ...axis })),
          instances: (face.instances || []).map((instance) => ({
            ...instance,
            coordinates: { ...instance.coordinates },
          })),
        }
      : null;
  }

  get selectedFamily() {
    const family = this.#selectedFamily();
    return family
      ? this.fonts.find(
          (entry) =>
            entry.family.toLocaleLowerCase() ===
            family.family.toLocaleLowerCase(),
        ) || null
      : null;
  }

  async inspectSelectedFace() {
    const family = this.#selectedFamily();
    const face = this.#selectedFace();
    if (family && face) await this.#inspectFace(family, face);
    return this.selectedFace;
  }

  get selectedResource() {
    return this.#resourceForValue(this.value);
  }

  get result() {
    return {
      ...normalizeFontPickerValue(this.value),
      resource: this.selectedResource
        ? JSON.parse(JSON.stringify(this.selectedResource))
        : null,
    };
  }

  get cssValue() {
    return fontPickerCss(this.value);
  }

  get value() {
    if (this.#eventValue !== undefined) return normalizeFontPickerValue(this.#eventValue);
    return normalizeFontPickerValue(
      this.getAttribute("value"),
      this.#initialValue || { family: "unset" },
    );
  }

  set value(value) {
    this.#reflectValue(value ?? "");
    this.#syncPresentation();
    this.#syncListSelection();
    this.#inspectSelectedFace();
  }

  get defaultValue() {
    return normalizeFontPickerValue(
      this.getAttribute("default"),
      this.#initialValue || { family: "unset" },
    );
  }

  get isDefault() {
    return figFontJsonValuesEqual(this.value, this.defaultValue);
  }

  resetToDefault() {
    this.value = this.defaultValue;
    figFontEmitReset(this);
  }

  open() {
    if (figEditorBooleanAttribute(this, "disabled") || !this.#dialog) return;
    this.#syncDialogPosition();
    if (!this.#dialog.open) {
      this.#dialog.open = true;
    }
    this.#valueAtOpen = serializeFontPickerValue(this.value);
    this.#lastChangeValue = this.#valueAtOpen;
    this.#syncTriggerDialogState();
    const family = this.value.family.toLocaleLowerCase();
    if (family !== "unset" && !this.#visibleFamilies().some((entry) => entry.family.toLocaleLowerCase() === family)) {
      this.#query = "";
      if (this.#search) this.#search.value = "";
      this.#showFontsPanel();
      this.#source = this.#fontSource = "all";
      this.#sourceSelect.value = "all";
      this.#sourceSelect.removeAttribute("disabled");
      this.#sourceSelect.removeAttribute("hidden");
      this.#favoritesOnly = false;
      this.#syncFavoritesOnlyButton();
    }
    const refresh = this.refreshFonts({ requestLocal: this.#localStatus !== "ready" });
    this.#scrollToSelectedFont();
    void refresh.then(() => this.#scrollToSelectedFont());
    requestAnimationFrame(() => {
      if (this.#dialog?.open) this.#search?.focus({ preventScroll: true });
    });
  }

  #scrollToSelectedFont() {
    requestAnimationFrame(() => {
      if (!this.#dialog?.open || !this.#list) return;
      const selected = this.#list.querySelector('[data-font-option-id][aria-selected="true"]');
      if (!selected) return;
      const listRect = this.#list.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      this.#list.scrollTo({
        top: this.#list.scrollTop + selectedRect.top - listRect.top -
          (this.#list.clientHeight - selectedRect.height) / 2,
        behavior: "instant",
      });
    });
  }

  close() {
    if (!this.#dialog?.open) return;
    this.#dialog.open = false;
  }

  focus(options) {
    if (!figEditorBooleanAttribute(this, "disabled")) this.#trigger?.focus(options);
  }
}


figEditorDefineElement("fig-font-picker", FigFontPicker);
