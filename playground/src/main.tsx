import { createRoot } from "react-dom/client";
import App from "./App";
import SandboxApp from "./SandboxApp";
import TestApp from "./TestApp";
import { hashRequiresEditorControls } from "./lib/editorSections";
import "./App.css";

type PlaygroundMode =
  | "playground"
  | "sandbox"
  | "tests";

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function resolveModeFromPath(pathname: string): PlaygroundMode {
  const normalized = normalizePathname(pathname);
  if (normalized === "/sandbox" || normalized.startsWith("/sandbox/")) {
    return "sandbox";
  }
  if (normalized === "/tests" || normalized.startsWith("/tests/")) {
    return "tests";
  }
  return "playground";
}

function applyTitleForMode(mode: PlaygroundMode) {
  if (mode === "sandbox") {
    document.title = "Sandbox playground: Styled React sample app";
    return;
  }
  if (mode === "tests") {
    document.title = "FigUI3 component tests";
    return;
  }
  document.title = "PropsKit: Figma components and property panels";
}

function ensureSupportedRoute() {
  const pathname = window.location.pathname;
  const normalized = normalizePathname(pathname);
  const search = window.location.search;
  const hash = window.location.hash;
  if (
    normalized === "/propskit/lab" ||
    normalized.startsWith("/propskit/lab/") ||
    normalized === "/propkit/lab" ||
    normalized.startsWith("/propkit/lab/") ||
    normalized === "/figui3/lab" ||
    normalized.startsWith("/figui3/lab/") ||
    normalized === "/lab" ||
    normalized.startsWith("/lab/")
  ) {
    const labHash = hash
      ? `#lab-${hash.replace(/^#/, "")}`
      : "";
    window.history.replaceState(null, "", `/${search}${labHash}`);
    return;
  }

  if (
    normalized === "/propkit" ||
    normalized.startsWith("/propkit/") ||
    normalized === "/figui3" ||
    normalized.startsWith("/figui3/") ||
    normalized === "/propskit" ||
    normalized.startsWith("/propskit/")
  ) {
    window.history.replaceState(null, "", `/${search}${hash}`);
    return;
  }

  const supported =
    normalized === "/" ||
    normalized === "" ||
    normalized === "/sandbox" ||
    normalized.startsWith("/sandbox/") ||
    normalized === "/tests" ||
    normalized.startsWith("/tests/");
  if (!supported) {
    window.history.replaceState(null, "", `/${search}${hash}`);
  }
}

const bootstrap = async () => {
  ensureSupportedRoute();
  const mode = resolveModeFromPath(window.location.pathname);
  const appRoot = document.getElementById("app")!;
  appRoot.dataset.mode = mode;
  const hashNeedsEditorControls =
    mode === "playground" && hashRequiresEditorControls(window.location.hash);
  if (hashNeedsEditorControls) {
    localStorage.setItem("includeEditorControls", "true");
  }

  if (mode !== "sandbox") {
    await import("@rogieking/figui3/fig.css");
    await import("@rogieking/figui3/fig.js");
    await import("@rogieking/figui3/fig-layer.css");
    await import("@rogieking/figui3/fig-layer.js");
    await import("../../fig-editor.css");
    // @ts-expect-error runtime side-effect import for editor component registration
    await import("../../fig-editor.js");
    await import("../../fig-lab.css");
    // @ts-expect-error runtime side-effect import for lab component registration
    await import("../../fig-lab.js");
  }

  applyTitleForMode(mode);
  createRoot(appRoot).render(
    mode === "sandbox" ? (
      <SandboxApp />
    ) : mode === "tests" ? (
      <TestApp />
    ) : (
      <App />
    ),
  );
};

bootstrap();
