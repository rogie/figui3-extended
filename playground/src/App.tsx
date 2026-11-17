import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "./components/Nav";
import ExampleView from "./components/ExampleView";
import AttributesView from "./components/AttributesView";
import CodeView from "./components/CodeView";
import EventView from "./components/EventView";
import PropsKitExampleView from "./components/PropsKitExampleView";
import StateOutputView from "./components/StateOutputView";
import ElementView from "./components/ElementView";
import FillsModuleView from "./components/FillsModuleView";
import FiltersModuleView from "./components/FiltersModuleView";
import ShadowsModuleView from "./components/ShadowsModuleView";
import TransformsModuleView from "./components/TransformsModuleView";
import { useTheme } from "./hooks/useTheme";
import { useNavigation } from "./hooks/useNavigation";
import { getExampleSourceMarkup } from "./lib/exampleMarkup";
import { applyAttributeMutation } from "./lib/attributeParser";
import {
  diffFromDefault,
  serializeToURL,
  readFromURL,
  clearURLParams,
  hasURLParams,
  applyParamsToMarkup,
} from "./lib/urlState";
import { figui3Sections } from "./data/figui3Sections";
import { labSections } from "./data/labSections";
import {
  propskitSections,
  type PropsKitExample,
} from "./data/propskitSections";
import { moduleSections } from "./data/moduleSections";
import type { Section } from "./data/sections";
import { sortSectionsWithinGroups } from "./lib/sectionOrder";
import {
  EDITOR_SECTION_IDS,
  hashRequiresEditorControls,
  requiresEditorControls,
} from "./lib/editorSections";

const mergedLabSections: Section[] = labSections.map((section) => ({
  ...section,
  id: `lab-${section.id}`,
  group: "Experimental",
}));

const allPlaygroundSections: Section[] = [
  ...propskitSections,
  ...figui3Sections,
  ...moduleSections,
  ...mergedLabSections,
];

function toSentenceCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildExampleTitle(sectionName: string, exampleName: string): string {
  const sectionWord = sectionName.trim().toLowerCase();
  const base = exampleName.trim();
  if (!base || base.toLowerCase() === "default")
    return toSentenceCase(sectionWord);
  if (base.toLowerCase().endsWith(sectionWord)) return toSentenceCase(base);
  return toSentenceCase(`${base} ${sectionWord}`);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildExampleDescription(
  sectionDescription: string,
  sectionName: string,
  exampleName: string,
): string {
  const sectionWord = escapeHtml(sectionName.trim().toLowerCase());
  const base = exampleName.trim();
  if (!base || base.toLowerCase() === "default") return sectionDescription;
  return `${escapeHtml(toSentenceCase(base))} ${sectionWord} example. ${sectionDescription}`;
}

function isPropsKitExample(
  example: Section["examples"][number] | undefined,
): example is PropsKitExample {
  return Boolean(example && "createConfig" in example);
}

function displayJson(value: unknown) {
  return JSON.stringify(
    value,
    (_key, entry) => {
      if (entry instanceof File) {
        return {
          name: entry.name,
          size: entry.size,
          type: entry.type,
        };
      }
      if (entry instanceof Event) {
        return { type: entry.type };
      }
      return entry;
    },
    2,
  );
}

function getRequiredCustomElements(markup: string): string[] {
  if (typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(markup, "text/html");
  const required = new Set<string>();

  doc.body.querySelectorAll("*").forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (tag.startsWith("fig-")) {
      required.add(tag);
      return;
    }

    const customizedBuiltIn = node.getAttribute("is")?.toLowerCase();
    if (customizedBuiltIn?.startsWith("fig-")) {
      required.add(customizedBuiltIn);
    }
  });

  return Array.from(required);
}

function getSectionRequiredCustomElements(section: Section): string[] {
  const required = new Set<string>();
  section.examples.forEach((example) => {
    getRequiredCustomElements(example.markup).forEach((tag) => required.add(tag));
  });
  return Array.from(required);
}

function isExampleAvailable(example: Section["examples"][number]) {
  if (typeof customElements === "undefined") return true;
  return getRequiredCustomElements(example.markup).every((tag) =>
    Boolean(customElements.get(tag)),
  );
}

const EDITOR_GROUP_NAME = "Editor components";

function filterAvailableSections(
  sections: Section[],
  options: { includeEditorControls: boolean },
): Section[] {
  const visibleSections = sections
    .filter((section) => {
      if (requiresEditorControls(section.id)) {
        return options.includeEditorControls;
      }
      return true;
    })
    .map((section) => ({
      ...section,
      group: EDITOR_SECTION_IDS.has(section.id) ? EDITOR_GROUP_NAME : section.group,
      examples: section.examples.filter(isExampleAvailable),
    }))
    .filter((section) => section.examples.length > 0);

  const editorSections = visibleSections.filter(
    (section) => section.group === EDITOR_GROUP_NAME,
  );
  if (!editorSections.length) return visibleSections;

  const otherSections = visibleSections.filter(
    (section) => section.group !== EDITOR_GROUP_NAME,
  );
  const lastCoreIndex = otherSections.reduce(
    (lastIndex, section, index) =>
      section.group === "Core components" ||
      section.group === "Inputs" ||
      section.group === "Media"
        ? index
        : lastIndex,
    -1,
  );
  const insertIndex = lastCoreIndex + 1;

  return [
    ...otherSections.slice(0, insertIndex),
    ...editorSections,
    ...otherSections.slice(insertIndex),
  ];
}

export default function App() {
  const {
    isDark,
    setTheme,
    includeEditorControls,
    setIncludeEditorControls,
    editorComponentsVersion,
  } = useTheme();
  const [customElementsVersion, setCustomElementsVersion] = useState(0);
  const sections = useMemo(() => {
    const visible = filterAvailableSections(allPlaygroundSections, {
      includeEditorControls,
    });
    return sortSectionsWithinGroups(visible);
  }, [
    customElementsVersion,
    editorComponentsVersion,
    includeEditorControls,
  ]);

  useEffect(() => {
    const showHashSection = () => {
      if (hashRequiresEditorControls(window.location.hash)) {
        setIncludeEditorControls(true);
      }
    };
    window.addEventListener("hashchange", showHashSection);
    return () => window.removeEventListener("hashchange", showHashSection);
  }, [setIncludeEditorControls]);

  const {
    activeSectionId,
    activeExampleId,
    activeSection,
    activeExample,
    navigateTo,
  } = useNavigation(sections, "/");
  const [editableMarkup, setEditableMarkup] = useState("");
  const [propsKitValues, setPropsKitValues] = useState<unknown>({});
  const [propsKitEvent, setPropsKitEvent] = useState<unknown>(null);
  const [moduleElementKind, setModuleElementKind] = useState("");
  const defaultMarkupRef = useRef("");
  const markupExampleKeyRef = useRef("");
  const initialParamsRef = useRef<Record<string, string> | null>(
    hasURLParams() ? readFromURL() : null,
  );
  const activeExampleKey = `${activeSectionId}/${activeExampleId}`;
  const activeDefaultMarkup = activeExample
    ? getExampleSourceMarkup(activeExample.markup)
    : "";
  const renderedMarkup =
    markupExampleKeyRef.current === activeExampleKey
      ? editableMarkup
      : activeDefaultMarkup;
  const activePropsKitExample = isPropsKitExample(activeExample)
    ? activeExample
    : null;
  const isFillsModule =
    activePropsKitExample?.cssModuleId === "background";
  const isFiltersModule =
    activePropsKitExample?.cssModuleId === "filters";
  const isShadowsModule =
    activePropsKitExample?.cssModuleId === "shadow";
  const isTransformsModule =
    activePropsKitExample?.cssModuleId === "transforms";

  useEffect(() => {
    if (!activePropsKitExample) return;
    setPropsKitEvent(null);
  }, [activeExampleKey, activePropsKitExample]);

  useEffect(() => {
    if (typeof customElements === "undefined") return;
    const pending = new Set<string>();
    allPlaygroundSections.forEach((section) => {
      getSectionRequiredCustomElements(section).forEach((tag) => {
        if (!customElements.get(tag)) pending.add(tag);
      });
    });

    let cancelled = false;
    pending.forEach((tag) => {
      customElements.whenDefined(tag).then(() => {
        if (!cancelled) setCustomElementsVersion((version) => version + 1);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeExample) {
      markupExampleKeyRef.current = activeExampleKey;
      setEditableMarkup("");
      defaultMarkupRef.current = "";
      return;
    }
    const defaultMarkup = getExampleSourceMarkup(activeExample.markup);
    markupExampleKeyRef.current = activeExampleKey;
    defaultMarkupRef.current = defaultMarkup;

    const initialParams = initialParamsRef.current;
    if (initialParams) {
      initialParamsRef.current = null;
      setEditableMarkup(applyParamsToMarkup(defaultMarkup, initialParams));
    } else {
      setEditableMarkup(defaultMarkup);
      clearURLParams();
    }
  }, [activeExample, activeExampleKey]);

  const handleMarkupChange = useCallback((nextMarkup: string) => {
    setEditableMarkup(nextMarkup);
    const defaultMarkup = defaultMarkupRef.current;
    if (defaultMarkup) {
      const diffs = diffFromDefault(nextMarkup, defaultMarkup);
      if (Object.keys(diffs).length > 0) {
        serializeToURL(diffs);
      } else {
        clearURLParams();
      }
    }
  }, []);

  const syncURL = useCallback((nextMarkup: string) => {
    const defaultMarkup = defaultMarkupRef.current;
    if (!defaultMarkup) return;
    const diffs = diffFromDefault(nextMarkup, defaultMarkup);
    if (Object.keys(diffs).length > 0) {
      serializeToURL(diffs);
    } else {
      clearURLParams();
    }
  }, []);

  const handlePersistImageSource = useCallback(
    (fieldIndex: number, src: string) => {
      if (!src) return;
      if (src.startsWith("blob:")) return;
      setEditableMarkup((currentMarkup) => {
        const next = applyAttributeMutation(currentMarkup, {
          fieldIndex,
          target: "control",
          name: "src",
          value: src,
        });
        syncURL(next);
        return next;
      });
    },
    [syncURL],
  );

  const handlePersistDialogOpenState = useCallback(
    (fieldIndex: number, isOpen: boolean) => {
      setEditableMarkup((currentMarkup) => {
        const next = applyAttributeMutation(currentMarkup, {
          fieldIndex,
          target: "control",
          name: "open",
          value: isOpen ? "" : null,
        });
        syncURL(next);
        return next;
      });
    },
    [syncURL],
  );

  const handlePersistSwitchCheckedState = useCallback(
    (fieldIndex: number, isChecked: boolean) => {
      setEditableMarkup((currentMarkup) => {
        const next = applyAttributeMutation(currentMarkup, {
          fieldIndex,
          target: "control",
          name: "checked",
          value: isChecked ? "" : null,
        });
        syncURL(next);
        return next;
      });
    },
    [syncURL],
  );

  const handlePersistControlValue = useCallback(
    (fieldIndex: number, value: string) => {
      setEditableMarkup((currentMarkup) => {
        const next = applyAttributeMutation(currentMarkup, {
          fieldIndex,
          target: "control",
          name: "value",
          value,
        });
        syncURL(next);
        return next;
      });
    },
    [syncURL],
  );

  const activeTitle =
    activeSection && activeExample
      ? (activeExample.title ??
          buildExampleTitle(activeSection.name, activeExample.name))
      : (activeSection?.name ?? "");
  const activeDescription =
    activeSection && activeExample
      ? (activeExample.description ??
          buildExampleDescription(
            activeSection.description,
            activeSection.name,
            activeExample.name,
          ))
      : (activeSection?.description ?? "");

  return (
    <>
      <Nav
        activeSectionId={activeSectionId}
        activeExampleId={activeExampleId}
        isDark={isDark}
        setTheme={setTheme}
        includeEditorControls={includeEditorControls}
        setIncludeEditorControls={setIncludeEditorControls}
        navigateTo={navigateTo}
        sections={sections}
        appTitle="Figma PropsKit"
      />
      <main
        className={[
          "mode-figui3",
          activePropsKitExample ? "mode-propskit" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {activeSection && (
          <div className="example-header">
            <h2>{activeTitle}</h2>
            <p
              className="description"
              dangerouslySetInnerHTML={{ __html: activeDescription }}
            />
          </div>
        )}
        {isFillsModule ? (
          <FillsModuleView
            elementKind={moduleElementKind}
            onValuesChange={setPropsKitValues}
            onEventChange={setPropsKitEvent}
          />
        ) : isFiltersModule ? (
          <FiltersModuleView
            onValuesChange={setPropsKitValues}
            onEventChange={setPropsKitEvent}
          />
        ) : isShadowsModule ? (
          <ShadowsModuleView
            onValuesChange={setPropsKitValues}
            onEventChange={setPropsKitEvent}
          />
        ) : isTransformsModule ? (
          <TransformsModuleView
            onValuesChange={setPropsKitValues}
            onEventChange={setPropsKitEvent}
          />
        ) : activePropsKitExample ? (
          <PropsKitExampleView
            key={activeExampleKey}
            example={activePropsKitExample}
            onValuesChange={setPropsKitValues}
            onEventChange={setPropsKitEvent}
            elementKind={moduleElementKind}
          />
        ) : activeExample ? (
          <div className="example-view-container">
            <ExampleView
              key={`${activeSectionId}/${activeExampleId}`}
              example={activeExample}
              markup={renderedMarkup}
              onPersistImageSource={handlePersistImageSource}
              onPersistDialogOpenState={handlePersistDialogOpenState}
              onPersistSwitchCheckedState={handlePersistSwitchCheckedState}
              onPersistControlValue={handlePersistControlValue}
            />
          </div>
        ) : null}
        {!activePropsKitExample && (
          <CodeView markup={renderedMarkup} onMarkupChange={handleMarkupChange} />
        )}
      </main>
      <aside
        className={`attributes-sidebar${
          activePropsKitExample ? " propskit-state-sidebar" : ""
        }`}
      >
        <div className="attributes-sidebar-content fig-overflow-fade">
          {activePropsKitExample ? (
            <>
              {activePropsKitExample.cssModuleId ? (
                <ElementView
                  value={moduleElementKind}
                  onChange={setModuleElementKind}
                />
              ) : null}
              <StateOutputView
                kind="values"
                title="Values"
                json={displayJson(propsKitValues)}
              />
              <StateOutputView
                kind="event"
                title="Latest event"
                json={
                  propsKitEvent === null
                    ? undefined
                    : displayJson(propsKitEvent)
                }
                emptyText="Interact with a control to see event output"
              />
            </>
          ) : (
            <>
              <AttributesView
                resetKey={activeExampleKey}
                markup={renderedMarkup}
                onMarkupChange={handleMarkupChange}
                showFieldControls={
                  activeExample?.fieldControls ??
                  renderedMarkup.includes("<fig-field")
                }
                includeFullControl
              />
              {activeSectionId !== "skeleton" && (
                <EventView key={`${activeSectionId}/${activeExampleId}`} />
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
