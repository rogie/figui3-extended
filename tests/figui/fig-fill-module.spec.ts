import { expect, test } from "@playwright/test";
import { bootFigFixture } from "./helpers";

test.describe("fig-module-fills", () => {
  test.beforeEach(async ({ page }) => {
    await bootFigFixture(page);
    await page.evaluate(() => import("/fig-editor.js"));
    await page.evaluate(() => customElements.whenDefined("fig-module-fills"));
  });

  test("hydrates fills from its attribute and property", async ({ page }) => {
    const initial = [
      { type: "solid", color: "#ff0000", visible: true },
      {
        type: "gradient",
        visible: false,
        gradient: {
          type: "linear",
          angle: 45,
          stops: [
            { position: 0, color: "#000000", opacity: 100 },
            { position: 100, color: "#ffffff", opacity: 100 },
          ],
        },
      },
    ];

    const hydrated = await page.evaluate((fills) => {
      const element = document.createElement("fig-module-fills") as HTMLElement & {
        fills: Array<Record<string, unknown>>;
        values: Record<string, string>;
      };
      element.setAttribute("fills", JSON.stringify(fills));
      document.body.append(element);
      return {
        fills: element.fills,
        values: element.values,
        rows: element.querySelectorAll("fig-property").length,
        handles: element.querySelectorAll('[slot="leading"]').length,
        tooltips: element.querySelectorAll(
          'fig-property > fig-tooltip, fig-property > fig-stack[slot="trailing"] > fig-tooltip',
        ).length,
      };
    }, initial);

    expect(hydrated.fills).toEqual(initial);
    expect(hydrated.values["background-color"]).toBe("#ff0000");
    expect(hydrated.rows).toBe(2);
    expect(hydrated.handles).toBe(2);
    expect(hydrated.tooltips).toBe(6);

    const propertyState = await page.evaluate(() => {
      const element = document.querySelector("fig-module-fills") as HTMLElement & {
        fills: Array<Record<string, unknown>>;
      };
      element.fills = [
        { type: "solid", color: "#00ff00", visible: true },
      ];
      return {
        attribute: element.getAttribute("fills"),
        rows: element.querySelectorAll("fig-property").length,
        handles: element.querySelectorAll('[slot="leading"]').length,
      };
    });

    expect(JSON.parse(propertyState.attribute!)).toEqual([
      { type: "solid", color: "#00ff00", visible: true },
    ]);
    expect(propertyState.rows).toBe(1);
    expect(propertyState.handles).toBe(0);
  });

  test("emits updated fills and mapped values", async ({ page }) => {
    await page.evaluate(() => {
      const element = document.createElement("fig-module-fills");
      element.setAttribute(
        "fills",
        JSON.stringify([
          { type: "solid", color: "#ff0000", visible: true },
        ]),
      );
      element.addEventListener("change", (event) => {
        (window as any).__fillChange = (event as CustomEvent).detail;
      });
      document.body.append(element);
    });

    await page
      .locator('fig-module-fills fig-button[aria-label="Hide fill"]')
      .click();

    const detail = await page.evaluate(() => (window as any).__fillChange);
    expect(detail.fills[0].visible).toBe(false);
    expect(detail.values).toEqual({
      "background-color": "#00000000",
      "background-image": "none",
      "background-size": "auto",
      "background-position": "0% 0%",
      "background-repeat": "repeat",
    });
  });

  test("applies gradient fill opacity to every stop", async ({ page }) => {
    const values = await page.evaluate(() => {
      const element = document.createElement("fig-module-fills") as HTMLElement & {
        fills: Array<Record<string, unknown>>;
        values: Record<string, string>;
      };
      element.fills = [
        {
          type: "gradient",
          visible: true,
          gradient: {
            type: "linear",
            angle: 45,
            opacity: 12,
            stops: [
              { position: 0, color: "#000000", opacity: 100 },
              { position: 100, color: "#ffffff", opacity: 50 },
            ],
          },
        },
        {
          type: "image",
          visible: true,
          image: { url: "https://example.com/image.png", scaleMode: "fill" },
        },
      ];
      document.body.append(element);
      return element.values;
    });

    expect(values).toEqual({
      "background-color": "#00000000",
      "background-image":
        'linear-gradient(45deg, #0000001f 0%, #ffffff0f 100%), url("https://example.com/image.png")',
      "background-size": "auto, cover",
      "background-position": "0% 0%, center",
      "background-repeat": "repeat, no-repeat",
    });
  });

  test("opens a newly added fill editor", async ({ page }) => {
    await page.evaluate(() => {
      document.body.append(document.createElement("fig-module-fills"));
    });

    await page
      .locator('fig-module-fills fig-button[aria-label="Add fill"]')
      .click();
    await page.locator('fig-menu-item[value="gradient"]').click();

    const rows = page.locator("fig-module-fills fig-reorder > fig-property");
    await expect(rows).toHaveCount(2);
    await expect(page.locator("fig-module-fills fig-reorder")).toHaveAttribute(
      "handle",
      'fig-icon[slot="leading"][name="drag-handle"]',
    );
    await expect(
      rows.locator(
        ':scope > fig-icon[slot="leading"][name="drag-handle"][data-reorder-handle]',
      ),
    ).toHaveCount(2);
    await expect(rows.last().locator("fig-input-fill")).toHaveAttribute(
      "value",
      /"type":"gradient"/,
    );
    await expect(page.locator("dialog.fig-fill-picker-dialog[open]")).toHaveCount(
      1,
    );
  });
});
