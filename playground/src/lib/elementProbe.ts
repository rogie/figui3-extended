const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function withElementProbe<T>(
  kind: string,
  callback: (element: Element | undefined) => T,
): T {
  if (!kind) return callback(undefined);

  const mount = document.createElement("div");
  let element: Element;
  if (kind.startsWith("svg:")) {
    const tag = kind.slice(4);
    const root = document.createElementNS(SVG_NAMESPACE, "svg");
    element =
      tag === "svg" ? root : document.createElementNS(SVG_NAMESPACE, tag);
    if (element !== root) root.append(element);
    mount.append(root);
  } else {
    element = document.createElement(kind);
    mount.append(element);
  }

  mount.style.position = "fixed";
  mount.style.left = "-10000px";
  mount.style.visibility = "hidden";
  mount.style.pointerEvents = "none";
  document.body.append(mount);
  try {
    return callback(element);
  } finally {
    mount.remove();
  }
}
