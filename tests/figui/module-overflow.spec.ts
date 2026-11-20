import { expect, test, type Locator } from "@playwright/test";
import { bootFigFixture } from "./helpers";

// A visible bounding box alone does not prove a popup escapes overflow clipping.
// Hit-test a point beyond the panel's bounds, descending through shadow roots.
async function expectOutsidePanelHit(popup: Locator) {
  await expect(popup).toBeVisible();
  await expect.poll(() => popup.evaluate((element) => {
    const panel = document.querySelector("#scroll-panel")!.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    for (const xFraction of [0.25, 0.5, 0.75]) {
      for (const yFraction of [0.1, 0.5, 0.9]) {
        const x = rect.left + rect.width * xFraction;
        const y = rect.top + rect.height * yFraction;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
        if (x >= panel.left && x <= panel.right && y >= panel.top && y <= panel.bottom) continue;
        let hit = document.elementFromPoint(x, y);
        while (hit?.shadowRoot) {
          const inner = hit.shadowRoot.elementFromPoint(x, y);
          if (!inner || inner === hit) break;
          hit = inner;
        }
        while (hit) {
          if (hit === element) return true;
          hit = hit.assignedSlot || hit.parentElement || (hit.getRootNode() as ShadowRoot).host;
        }
      }
    }
    return false;
  })).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  await page.route("**/propskit.js", (route) => route.fulfill({ path: "node_modules/@rogieking/figui3/dist/propskit.js", contentType: "text/javascript" }));
  await bootFigFixture(page);
  await page.addScriptTag({ type: "importmap", content: JSON.stringify({ imports: { "@rogieking/figui3/propskit.js": "/propskit.js" } }) });
  await page.addStyleTag({ url: "/fig-editor.css" });
  await page.evaluate(async () => {
    await import("/fig-editor.js");
    const { figCreateModule } = await import("/css-properties.js");
    (window as any).mountOverflowModule = (id: string) => {
      const panel = document.createElement("div");
      panel.id = "scroll-panel";
      panel.style.cssText = "position:fixed;left:400px;top:180px;width:320px;height:160px;overflow:auto;transform:translateZ(0);contain:paint";
      document.body.append(panel);
      if (["fills", "filters", "shadows", "transforms"].includes(id)) {
        panel.append(document.createElement(`fig-module-${id}`));
      } else {
        (window as any).overflowModule = figCreateModule(id, {
          values: id === "border" || id === "outline" ? { [`${id}-width`]: "2px", [`${id}-style`]: "solid" } : id === "stroke" ? { stroke: "#000000" } : {},
        }).mount(panel);
      }
      const spacer = document.createElement("div");
      spacer.style.height = "600px";
      panel.append(spacer);
    };
  });
});

for (const { id, trigger, popup } of [
  { id: "transforms", trigger: 'fig-button[aria-haspopup="dialog"]', popup: 'fig-module-transforms fig-property > dialog' },
  { id: "shadows", trigger: 'fig-button[aria-haspopup="dialog"]', popup: 'fig-module-shadows fig-property > dialog' },
  { id: "fills", trigger: "fig-input-fill fig-swatch", popup: ".fig-fill-picker-dialog" },
  { id: "filters", trigger: 'fig-select[label="Filter type"]', popup: 'dialog[role="listbox"][open]' },
  { id: "layout", trigger: 'fig-split-input[aria-label="Width"] fig-select', popup: 'dialog[role="listbox"][open]' },
  { id: "typography", trigger: ".fig-font-picker-surface > fig-select", popup: ".fig-font-picker-dialog" },
  { id: "appearance", trigger: 'fig-select[label="Blend mode"]', popup: 'dialog[role="listbox"][open]' },
  { id: "border", trigger: 'fig-select[label="Border style"]', popup: 'dialog[role="listbox"][open]' },
  { id: "outline", trigger: 'fig-select[label="Outline style"]', popup: 'dialog[role="listbox"][open]' },
  { id: "stroke", trigger: 'fig-select[label="Stroke style"]', popup: 'dialog[role="listbox"][open]' },
]) {
  test(`${id} popup escapes a transformed overflow container`, async ({ page }) => {
    await page.evaluate((id) => (window as any).mountOverflowModule(id), id);
    if (id === "layout") {
      // This short menu otherwise fits entirely inside the panel.
      await page.locator("#scroll-panel").evaluate((element: HTMLElement) => {
        element.style.height = "60px";
      });
    }
    await page.locator(`#scroll-panel ${trigger}`).click();
    const editor = page.locator(popup);
    await expectOutsidePanelHit(editor);
    if (id === "transforms" || id === "shadows") {
      await expect(editor).toHaveAttribute("popover", "manual");
      await page.locator("#scroll-panel").evaluate((element) => { element.scrollTop = 20; });
      await expectOutsidePanelHit(editor);
      await page.keyboard.press("Escape");
      await expect(editor).toBeHidden();
      await expect(page.locator(`#scroll-panel ${trigger}`)).toHaveAttribute("aria-expanded", "false");
    }
  });
}

test("nested shadow color picker renders above its parent editor", async ({ page }) => {
  await page.evaluate(() => (window as any).mountOverflowModule("shadows"));
  await page.locator('fig-module-shadows fig-button[aria-haspopup="dialog"]').click();
  const parent = page.locator("fig-module-shadows fig-property > dialog");
  await parent.locator('fig-input-color[aria-label="Shadow color"] fig-swatch').click();
  const child = page.locator(".fig-fill-picker-dialog");
  await expectOutsidePanelHit(child);
  await child.locator(".fig-fill-picker-ci-hex-row fig-input-text input").fill("FF0000");
  await expect(parent).toBeVisible();
  await expect(child).toBeVisible();
  await child.locator(".fig-fill-picker-close").click();
  await expect(parent).toBeVisible();
  await parent.locator('[aria-label="Close shadow editor"]').click();
  await expect(parent).toBeHidden();
});

test("transform type menu stays interactive above its parent editor", async ({ page }) => {
  await page.evaluate(() => (window as any).mountOverflowModule("transforms"));
  await page.locator('fig-module-transforms fig-button[aria-haspopup="dialog"]').click();
  await page.locator('fig-module-transforms fig-select[label="Transform type"]').click();
  await page.getByRole("option", { name: "Scale", exact: true }).click();
  const popup = page.locator("fig-module-transforms fig-property > dialog");
  await expectOutsidePanelHit(popup);
  await popup.locator('fig-input-number[aria-label="X scale"] input').press("ArrowUp");
  expect(await page.locator("fig-module-transforms").evaluate((element: any) => element.values.transform)).toBe("scale3d(1.01, 1, 1)");
});
