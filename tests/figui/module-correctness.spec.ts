import { expect, test } from "@playwright/test";
import { bootFigFixture } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  await page.route("**/propskit.js", (route) => route.fulfill({
    path: "node_modules/@rogieking/figui3/dist/propskit.js",
    contentType: "text/javascript",
  }));
  await bootFigFixture(page);
  await page.addScriptTag({ type: "importmap", content: JSON.stringify({
    imports: { "@rogieking/figui3/propskit.js": "/propskit.js" },
  }) });
  await page.addStyleTag({ url: "/fig-editor.css" });
  await page.evaluate(async () => {
    await import("/fig-editor.js");
    const { figCreateModule } = await import("/css-properties.js");
    (window as any).mountModule = (id: string, options = {}) => {
      const changes: any[] = [];
      const module = figCreateModule(id, {
        ...options,
        onInput: (path: string, value: unknown) => changes.push({ path, value, phase: "input" }),
        onChange: (path: string, value: unknown) => changes.push({ path, value, phase: "change" }),
      }).mount("#fixture-root");
      (window as any).auditModule = module;
      (window as any).changes = changes;
      return module;
    };
  });
});

test("fills preserve canonical alpha and multiply existing color alpha", async ({ page }) => {
  const result = await page.evaluate(() => {
    const element = document.createElement("fig-module-fills") as any;
    document.body.append(element);
    const cases = [
      { type: "solid", color: "#336699", alpha: 0.25 },
      { type: "solid", color: "#33669980", alpha: 0.5 },
      { type: "solid", color: "rgb(20, 40, 60)", alpha: 0.5 },
    ];
    return cases.map((fill) => {
      element.fills = [fill];
      const css = element.values["background-color"];
      const probe = document.createElement("div");
      probe.style.backgroundColor = css;
      document.body.append(probe);
      return { css, computed: getComputedStyle(probe).backgroundColor };
    });
  });
  expect(result[0].css).toBe("#33669940");
  expect(result[1].css).toBe("#33669940");
  expect(result[2].computed).toBe("color(srgb 0.0784314 0.156863 0.235294 / 0.5)");
});

for (const [type, prefix] of [["radial", "radial-gradient("], ["angular", "conic-gradient("]]) {
  test(`fills serialize ${type} gradient hydration`, async ({ page }) => {
    const css = await page.evaluate((type) => {
      const element = document.createElement("fig-module-fills") as any;
      element.fills = [{ type: "gradient", gradient: { type, angle: 45, stops: [
        { color: "#ff0000", position: 0, opacity: 1 },
        { color: "#0000ff", position: 100, opacity: 100 },
      ] } }];
      document.body.append(element);
      return element.values["background-image"];
    }, type);
    expect(css).toContain(prefix);
    expect(css).toContain("#ff000003");
  });
}

test("image fill sizing and opacity follow layer order and reset on removal", async ({ page }) => {
  const result = await page.evaluate(() => {
    const element = document.createElement("fig-module-fills") as any;
    element.fills = [
      { type: "image", image: { url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", scaleMode: "fit", opacity: 0.4 } },
      { type: "image", image: { url: "tile.png", scaleMode: "tile", scale: 25 } },
      { type: "solid", color: "#ffffff" },
    ];
    document.body.append(element);
    const values = element.values;
    const accepted = Object.entries(values).every(([property, value]) => CSS.supports(property, String(value)));
    element.fills = [];
    return { values, accepted, reset: element.values };
  });
  expect(result.accepted).toBe(true);
  expect(result.values["background-image"]).toContain("cross-fade(");
  expect(result.values["background-size"]).toBe("contain, 25%");
  expect(result.values["background-position"]).toBe("center, 0% 0%");
  expect(result.values["background-repeat"]).toBe("no-repeat, repeat");
  expect(result.reset).toMatchObject({ "background-size": "auto", "background-position": "0% 0%", "background-repeat": "repeat" });
});

test("border snapshots agree with edits and public setters", async ({ page }) => {
  const result = await page.evaluate(() => {
    const module = (window as any).mountModule("border", { values: { "border-width": "2px", "border-style": "solid" } });
    const width = module.element.querySelector('[aria-label="Border width"]');
    width.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: 7 }));
    const apply = () => {
      const probe = document.createElement("div");
      document.body.append(probe);
      for (const [property, value] of Object.entries(module.getValues())) probe.style.setProperty(property, String(value));
      return ["top", "right", "bottom", "left"].map((side) => getComputedStyle(probe).getPropertyValue(`border-${side}-width`));
    };
    const edited = apply();
    module.setValue("border-left-width", "3px");
    const oneSide = apply();
    module.setValues({ "border-width": "5px", "border-right-width": "9px" });
    const multiple = apply();
    module.resetValues();
    return { edited, oneSide, multiple, reset: apply() };
  });
  expect(result).toEqual({ edited: ["7px", "7px", "7px", "7px"], oneSide: ["7px", "7px", "7px", "3px"], multiple: ["5px", "9px", "5px", "5px"], reset: ["2px", "2px", "2px", "2px"] });
});

for (const id of ["border", "outline", "stroke"]) {
  test(`${id} color edits preserve alpha without applying it twice`, async ({ page }) => {
    const result = await page.evaluate((id) => {
      const module = (window as any).mountModule(id, { values: { [`${id}-width`]: "2px", [`${id}-style`]: "solid", ...(id === "stroke" ? { stroke: "#000000" } : {}) } });
      const label = `${id[0].toUpperCase()}${id.slice(1)} color`;
      module.element.querySelector(`[aria-label="${label}"]`).dispatchEvent(new CustomEvent("change", {
        bubbles: true, detail: { value: "#11223380", hex: "#11223380", hexOpaque: "#112233", rgba: { r: 17, g: 34, b: 51, a: 0.5 } },
      }));
      return (window as any).changes;
    }, id);
    if (id === "stroke") {
      expect(result).toEqual([{ path: "stroke", value: "#112233", phase: "change" }, { path: "stroke-opacity", value: 0.5, phase: "change" }]);
    } else expect(result).toEqual([{ path: `${id}-color`, value: "#11223380", phase: "change" }]);
  });
}

test("typography converts pixel letter spacing to percentage of font size", async ({ page }) => {
  await page.evaluate(() => (window as any).mountModule("typography", { values: { "font-size": "20px", "letter-spacing": "2px" } }));
  const input = page.locator('[data-typography-property="letter-spacing"] input');
  await expect(input).toHaveValue("10%");
  await input.press("ArrowUp");
  expect(await page.evaluate(() => (window as any).auditModule.values["letter-spacing"])).toBe("0.11em");
});

for (const [id, property, selector] of [
  ["typography", "font-size", '[data-typography-property="font-size"] input'],
  ["typography", "line-height", '[data-typography-property="line-height"] input'],
  ["layout", "width", 'fig-split-input[aria-label="Width"] input'],
]) {
  test(`${property} cannot emit negative CSS from keyboard input`, async ({ page }) => {
    await page.evaluate((id) => (window as any).mountModule(id), id);
    await page.locator(selector).fill("-5");
    await page.locator(selector).press("Tab");
    const changes = await page.evaluate(() => (window as any).changes);
    expect(changes.length).toBeGreaterThan(0);
    for (const change of changes) {
      expect(change.path).toBe(property);
      expect(change.value).toBe(id === "layout" ? "0%" : "0px");
    }
  });
}

test("layout locks ratio while resizing either dimension", async ({ page }) => {
  await page.evaluate(() => (window as any).mountModule("layout", { values: { width: "200px", height: "100px", "aspect-ratio": "2 / 1" } }));
  const width = page.locator('fig-split-input[aria-label="Width"] input');
  await width.fill("400");
  await width.press("Tab");
  expect(await page.evaluate(() => (window as any).auditModule.values)).toMatchObject({ width: "400px", height: "200px", "aspect-ratio": "2 / 1" });
  const height = page.locator('fig-split-input[aria-label="Height"] input');
  await height.fill("150");
  await height.press("Tab");
  expect(await page.evaluate(() => (window as any).auditModule.values)).toMatchObject({ width: "300px", height: "150px", "aspect-ratio": "2 / 1" });
});

test("appearance preserves percentage radius, complex corners, and fractional opacity", async ({ page }) => {
  await page.evaluate(() => (window as any).mountModule("appearance", { values: { opacity: 0.555, "border-radius": "50%" } }));
  await expect(page.locator('[aria-label="Opacity"] input')).toHaveValue("55.5%");
  await page.locator('[aria-label="Border radius"] input').press("ArrowUp");
  expect(await page.evaluate(() => (window as any).auditModule.values["border-radius"])).toBe("51%");
  await page.evaluate(() => (window as any).auditModule.setValue("border-radius", "10px 20px / 30px 40px"));
  const input = page.locator('fig-input-text[aria-label="Border radius"] input');
  await expect(input).toHaveValue("10px 20px / 30px 40px");
  await input.fill("12px 24px / 36px 48px");
  await input.press("Tab");
  expect(await page.evaluate(() => (window as any).auditModule.values["border-radius"])).toBe("12px 24px / 36px 48px");
});

test("custom stroke dash patterns remain editable", async ({ page }) => {
  await page.evaluate(() => (window as any).mountModule("stroke", { values: { stroke: "#000000", "stroke-dasharray": "3 4 5 6" } }));
  const input = page.locator('[aria-label="Stroke dash array"] input');
  await expect(input).toBeVisible();
  await input.fill("2 4 6 8");
  await input.press("Tab");
  expect(await page.evaluate(() => (window as any).auditModule.values["stroke-dasharray"])).toBe("2 4 6 8");
});

test("stroke starts at browser defaults and renders only its Add action", async ({ page }) => {
  const initial = await page.evaluate(() => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const rect = document.createElementNS(svg.namespaceURI, "rect");
    svg.append(rect);
    document.body.append(svg);
    const module = (window as any).mountModule("stroke");
    return {
      values: module.values,
      browser: { stroke: getComputedStyle(rect).stroke, width: getComputedStyle(rect).strokeWidth },
    };
  });
  expect(initial.values.stroke).toBe(initial.browser.stroke);
  expect(initial.values["stroke-width"]).toBe(initial.browser.width);
  await expect(page.locator("fig-module-stroke fig-group > :not(fig-header)")).toHaveCount(0);
  await page.getByRole("button", { name: "Add stroke", exact: true }).click();
  await expect(page.locator('[aria-label="Stroke width"] input')).toHaveValue("1");
  await expect(page.getByRole("button", { name: "Hide stroke", exact: true })).toBeVisible();
});

for (const id of ["stroke", "border"]) {
  test(`${id} visibility keeps controls and restores width while remove clears paint`, async ({ page }) => {
    await page.evaluate((id) => (window as any).mountModule(id, { values: {
      ...(id === "stroke" ? { stroke: "#336699", "stroke-opacity": 0.4, "stroke-dasharray": "3 4 5 6" } : { "border-color": "#336699", "border-style": "solid" }),
      [`${id}-width`]: "3.5px",
    } }), id);
    const before = await page.evaluate(() => (window as any).auditModule.getValues());
    const width = page.locator(`fig-input-number[aria-label="${id === "stroke" ? "Stroke" : "Border"} width"]`);
    await page.getByRole("button", { name: `Hide ${id}`, exact: true }).click();
    await expect(width).toBeVisible();
    await expect(width.locator("input")).toHaveValue("0");
    await expect(page.getByRole("button", { name: `Add ${id}`, exact: true })).toBeHidden();
    const hidden = await page.evaluate(() => (window as any).auditModule.getValues());
    expect(hidden[`${id}-width`]).toBe("0px");
    if (id === "stroke") {
      expect(hidden.stroke).toBe(before.stroke);
      expect(hidden["stroke-opacity"]).toBe(before["stroke-opacity"]);
      expect(hidden["stroke-dasharray"]).toBe(before["stroke-dasharray"]);
    } else expect(hidden["border-style"]).toBe("solid");
    expect(await page.evaluate(() => (window as any).changes)).toEqual([
      { path: `${id}-width`, value: "0px", phase: "change" },
    ]);
    await page.getByRole("button", { name: `Show ${id}`, exact: true }).click();
    expect(await page.evaluate(() => (window as any).auditModule.getValues())).toEqual(before);
    await expect(width.locator("input")).toHaveValue("3.5");
    // Manual zero width also retains the row and shows the correct action.
    await width.locator("input").fill("0");
    await width.locator("input").press("Tab");
    await page.getByRole("button", { name: `Show ${id}`, exact: true }).click();
    await expect(width.locator("input")).toHaveValue("3.5");
    await page.getByRole("button", { name: `Hide ${id}`, exact: true }).click();
    await page.getByRole("button", { name: `Remove ${id}`, exact: true }).click();
    await expect(page.locator(`fig-module-${id} fig-group > :not(fig-header)`)).toHaveCount(0);
    const removed = await page.evaluate(() => (window as any).auditModule.getValues());
    expect(id === "stroke" ? removed.stroke : removed["border-style"]).toBe("none");
    await page.getByRole("button", { name: `Add ${id}`, exact: true }).click();
    await expect(width).toBeVisible();
    await expect(width.locator("input")).toHaveValue("1");
  });
}

test("border visibility remembers each side independently", async ({ page }) => {
  await page.evaluate(() => (window as any).mountModule("border", { values: {
    "border-style": "solid", "border-width": "2px 4px 6px 8px",
  } }));
  const selectSide = async (side: string) => {
    await page.locator('fig-select[label="Border sides"]').evaluate((element: any, value) => {
      element.value = value;
      element.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: value }));
    }, side);
  };
  await selectSide("top");
  await page.getByRole("button", { name: "Hide border", exact: true }).click();
  await selectSide("right");
  await page.getByRole("button", { name: "Hide border", exact: true }).click();
  await page.getByRole("button", { name: "Show border", exact: true }).click();
  await selectSide("top");
  await page.getByRole("button", { name: "Show border", exact: true }).click();
  const values = await page.evaluate(() => (window as any).auditModule.getValues());
  expect(values["border-width"]).toBe("2px 4px 6px 8px");
  await selectSide("all");
  await page.getByRole("button", { name: "Hide border", exact: true }).click();
  await page.getByRole("button", { name: "Show border", exact: true }).click();
  expect(await page.evaluate(() => (window as any).auditModule.values["border-width"])).toBe("2px 4px 6px 8px");
});

test("stroke seeded from an SVG element restores its existing width", async ({ page }) => {
  await page.evaluate(() => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const rect = document.createElementNS(svg.namespaceURI, "rect");
    rect.setAttribute("stroke", "#336699");
    rect.setAttribute("stroke-width", "6.5");
    svg.append(rect);
    document.body.append(svg);
    (window as any).mountModule("stroke", { element: rect });
  });
  const input = page.locator('[aria-label="Stroke width"] input');
  await expect(input).toHaveValue("6.5");
  await page.getByRole("button", { name: "Hide stroke", exact: true }).click();
  await page.getByRole("button", { name: "Show stroke", exact: true }).click();
  await expect(input).toHaveValue("6.5");
});

for (const id of ["fills", "filters", "shadows", "transforms", "stroke", "border", "outline"]) {
  test(`${id} empty header uses icon tokens for Add hover and keyboard focus`, async ({ page }) => {
    await page.evaluate((id) => {
      const root = document.querySelector("#fixture-root") as HTMLElement;
      root.style.setProperty("--figma-color-icon-secondary", "rgb(11, 22, 33)");
      root.style.setProperty("--figma-color-icon", "rgb(44, 55, 66)");
      if (["fills", "filters", "shadows", "transforms"].includes(id)) {
        const element = document.createElement(`fig-module-${id}`);
        element.setAttribute(id, "[]");
        root.append(element);
      } else (window as any).mountModule(id);
    }, id);
    const header = page.locator(`fig-module-${id} > fig-group > fig-header`);
    const addIcon = header.locator('fig-icon[name="add"]');
    await page.mouse.move(1100, 700);
    await expect(addIcon).toHaveCSS("color", "rgb(11, 22, 33)");
    await header.hover();
    await expect(addIcon).toHaveCSS("color", "rgb(44, 55, 66)");
    await page.mouse.move(1100, 700);
    await expect(addIcon).toHaveCSS("color", "rgb(11, 22, 33)");
    await header.locator('fig-button[aria-label^="Add "]').focus();
    await expect(addIcon).toHaveCSS("color", "rgb(44, 55, 66)");
  });
}

for (const id of ["fills", "filters", "shadows", "transforms"]) {
  test(`${id} trailing ghost stack aligns Remove with header Add`, async ({ page }) => {
    await page.evaluate((id) => {
      document.querySelector("#fixture-root")!.append(document.createElement(`fig-module-${id}`));
    }, id);
    const module = page.locator(`fig-module-${id}`);
    const add = module.locator('fig-header fig-button[aria-label^="Add "]');
    const remove = module.locator('fig-button[aria-label^="Remove "]');
    const [addBox, removeBox] = await Promise.all([add.boundingBox(), remove.boundingBox()]);
    expect(removeBox!.x + removeBox!.width / 2).toBeCloseTo(addBox!.x + addBox!.width / 2, 1);
  });
}

test("filters normalize negative magnitudes and allow unrestricted hue angles", async ({ page }) => {
  const values = await page.evaluate(() => {
    const element = document.createElement("fig-module-filters") as any;
    element.filters = [{ type: "gaussian-blur", radius: -2 }, { type: "contrast", amount: -1 }, { type: "hue-rotate", angle: -450 }];
    document.body.append(element);
    return element.values;
  });
  expect(values.filter).toBe("blur(0px) contrast(0) hue-rotate(-450deg)");
  await page.locator('[aria-label="Hue rotate value"] input').press("ArrowDown");
  expect(await page.locator("fig-module-filters").evaluate((element: any) => element.values.filter)).toContain("hue-rotate(-451deg)");
});

for (const dismissal of ["close button", "Escape", "outside", "programmatic"]) {
  test(`shadow trigger clears after ${dismissal} dismissal`, async ({ page }) => {
    await page.evaluate(() => document.querySelector("#fixture-root")!.append(document.createElement("fig-module-shadows")));
    const trigger = page.locator('fig-module-shadows fig-button[aria-haspopup="dialog"]');
    await trigger.click();
    await expect(trigger).toHaveAttribute("selected", "");
    if (dismissal === "close button") await page.locator('[aria-label="Close shadow editor"]').click();
    else if (dismissal === "Escape") await page.keyboard.press("Escape");
    else if (dismissal === "outside") await page.mouse.click(1, 1);
    else await page.locator('fig-module-shadows dialog[role="dialog"]').evaluate((element: any) => { element.open = false; });
    await expect(trigger).not.toHaveAttribute("selected");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
}
