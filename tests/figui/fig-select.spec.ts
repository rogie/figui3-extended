import { expect, test } from "@playwright/test";
import { bootFigFixture } from "./helpers";

test.describe("fig-select", () => {
  test.beforeEach(async ({ page }) => {
    await bootFigFixture(page);
    await page.addStyleTag({ url: "/fig-editor.css" });
    await page.addScriptTag({ type: "module", url: "/fig-editor.js" });
    await page.evaluate(() => customElements.whenDefined("fig-select"));
  });

  test('icon="compact" matches compact fig-button sizing', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const root = document.querySelector("#fixture-root");
      if (!root) throw new Error("Missing fixture root");
      root.setAttribute(
        "style",
        "display: flex; flex-direction: column; align-items: flex-start",
      );
      root.innerHTML = `
        <fig-button id="button" icon="compact" aria-label="Button">
          <fig-icon name="chevron" size="small"></fig-icon>
        </fig-button>
        <fig-select id="select" icon="compact" aria-label="Select"></fig-select>
        <fig-button id="large-button" icon="compact" size="large" aria-label="Button">
          <fig-icon name="chevron" size="small"></fig-icon>
        </fig-button>
        <fig-select id="large-select" icon="compact" size="large" aria-label="Select"></fig-select>
      `;

      const size = (selector: string) => {
        const rect = root.querySelector(selector)!.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      };
      const compactSelect = root.querySelector("#select")!;
      const compactButtonIcon = root.querySelector("#button fig-icon")!;
      const chevron = getComputedStyle(compactSelect, "::after");
      const buttonIcon = getComputedStyle(compactButtonIcon);
      return {
        button: size("#button"),
        select: size("#select"),
        largeButton: size("#large-button"),
        largeSelect: size("#large-select"),
        chevron: {
          width: Number.parseFloat(chevron.width),
          height: Number.parseFloat(chevron.height),
          maskSize: chevron.maskSize,
        },
        buttonIcon: {
          width: Number.parseFloat(buttonIcon.width),
          height: Number.parseFloat(buttonIcon.height),
          maskSize: buttonIcon.maskSize,
        },
      };
    });

    expect(metrics.select).toEqual(metrics.button);
    expect(metrics.largeSelect).toEqual(metrics.largeButton);
    expect(metrics.chevron).toEqual({
      ...metrics.buttonIcon,
      maskSize: "auto",
    });
  });
});
