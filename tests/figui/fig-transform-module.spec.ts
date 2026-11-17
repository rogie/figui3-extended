import { expect, test } from "@playwright/test";
import { bootFigFixture } from "./helpers";

test.describe("fig-module-transforms", () => {
  test.beforeEach(async ({ page }) => {
    await bootFigFixture(page);
    await page.evaluate(() => import("/fig-editor.js"));
    await page.evaluate(() =>
      customElements.whenDefined("fig-module-transforms"),
    );
  });

  test("hydrates and serializes an ordered transform stack", async ({
    page,
  }) => {
    const result = await page.evaluate(() => {
      const element = document.createElement(
        "fig-module-transforms",
      ) as HTMLElement & {
        transforms: Array<Record<string, unknown>>;
        values: Record<string, string>;
      };
      element.transforms = [
        { type: "translate", x: 12, y: 24, z: 0, visible: true },
        { type: "rotate", x: 0, y: 0, z: 45, visible: true },
        { type: "scale", x: 1.5, y: 1.5, z: 1, visible: true },
        { type: "skew", x: 10, y: 0, visible: true },
        { type: "perspective", depth: 800, visible: true },
      ];
      document.body.append(element);
      return {
        transforms: element.transforms,
        values: element.values,
        rows: element.querySelectorAll("fig-property").length,
        triggers: element.querySelectorAll(
          'fig-button[variant="property"][aria-haspopup="dialog"]',
        ).length,
        editors: element.querySelectorAll('dialog[is="fig-popup"]').length,
        tooltips: element.querySelectorAll(
          'fig-property > fig-tooltip, fig-property > fig-stack[slot="trailing"] > fig-tooltip',
        ).length,
      };
    });

    expect(result.values.transform).toBe(
      "translate3d(12px, 24px, 0px) " +
        "rotateX(0deg) rotateY(0deg) rotateZ(45deg) " +
        "scale3d(1.5, 1.5, 1) skew(10deg, 0deg) perspective(800px)",
    );
    expect(result.transforms).toHaveLength(5);
    expect(result.rows).toBe(5);
    expect(result.triggers).toBe(5);
    expect(result.editors).toBe(5);
    expect(result.tooltips).toBe(10);
  });

  test("renders type-specific dialog fields", async ({ page }) => {
    await page.evaluate(() => {
      const element = document.createElement(
        "fig-module-transforms",
      ) as HTMLElement & {
        transforms: Array<Record<string, unknown>>;
      };
      element.transforms = [
        { type: "translate", x: 0, y: 0, z: 0, visible: true },
        { type: "perspective", depth: 1000, visible: true },
      ];
      document.body.append(element);
    });

    const triggers = page.locator(
      'fig-module-transforms fig-button[variant="property"]',
    );
    await expect(triggers.locator('fig-icon[slot="prepend"]')).toHaveCount(0);
    await triggers.first().click();
    await expect(
      page.locator(
        'fig-module-transforms dialog[open] > fig-header[dialog-header]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator(
        'fig-module-transforms dialog[open] > fig-header[dialog-header][data-auto]',
      ),
    ).toHaveCount(0);
    await expect(
      page.locator(
        'fig-module-transforms dialog[open] fig-input-number',
      ),
    ).toHaveCount(3);

    await page.keyboard.press("Escape");
    await triggers.last().click();
    await expect(
      page.locator(
        'fig-module-transforms dialog[open] fig-input-number[aria-label="Depth"]',
      ),
    ).toHaveCount(1);
  });

  test("uses the 3D rotate editor for rotate transforms", async ({ page }) => {
    await page.evaluate(() => {
      const element = document.createElement(
        "fig-module-transforms",
      ) as HTMLElement & {
        transforms: Array<Record<string, unknown>>;
      };
      element.transforms = [
        { type: "rotate", x: 10, y: 20, z: 30, visible: true },
      ];
      document.body.append(element);
    });

    await page
      .locator('fig-module-transforms fig-button[variant="property"]')
      .click();
    const editor = page.locator(
      "fig-module-transforms dialog[open] fig-3d-rotate",
    );
    await expect(editor).toHaveAttribute("fields", "rotateX,rotateY,rotateZ");
    await expect(editor).toHaveAttribute("aspect-ratio", "4/3");
    await expect(editor).toHaveAttribute(
      "value",
      "rotateX(10deg) rotateY(20deg) rotateZ(30deg)",
    );
    await expect(editor.locator("..")).toHaveAttribute("padding", "");
    await expect(
      page.locator("fig-module-transforms dialog[open] > fig-content > fig-field"),
    ).toHaveCount(0);

    await editor.evaluate((element) => {
      element.dispatchEvent(
        new CustomEvent("input", {
          bubbles: true,
          detail: { rotateX: 45, rotateY: -15, rotateZ: 90 },
        }),
      );
    });
    await expect
      .poll(() =>
        page.locator("fig-module-transforms").evaluate((element: any) => ({
          transform: element.transforms[0],
          value: element.values.transform,
        })),
      )
      .toEqual({
        transform: {
          type: "rotate",
          x: 45,
          y: -15,
          z: 90,
          visible: true,
        },
        value: "rotateX(45deg) rotateY(-15deg) rotateZ(90deg)",
      });
  });

  test("opens a newly added transform editor", async ({ page }) => {
    await page.evaluate(() => {
      document.body.append(document.createElement("fig-module-transforms"));
    });

    await page
      .locator('fig-module-transforms fig-button[aria-label="Add transform"]')
      .click();
    await page.locator('fig-menu-item[value="rotate"]').click();

    const rows = page.locator(
      "fig-module-transforms fig-reorder > fig-property",
    );
    await expect(rows).toHaveCount(2);
    await expect(
      page.locator("fig-module-transforms fig-reorder"),
    ).toHaveAttribute(
      "handle",
      'fig-icon[slot="leading"][name="drag-handle"]',
    );
    await expect(
      rows.locator(
        ':scope > fig-icon[slot="leading"][name="drag-handle"][data-reorder-handle]',
      ),
    ).toHaveCount(2);
    await expect(
      rows.last().locator(':scope > dialog[is="fig-popup"]'),
    ).toHaveAttribute("open", "true");
    await expect(
      rows.last().locator('fig-button[aria-haspopup="dialog"]'),
    ).toHaveAttribute("aria-expanded", "true");
  });

  test("visibility and removal update the mapped value", async ({ page }) => {
    await page.evaluate(() => {
      const element = document.createElement(
        "fig-module-transforms",
      ) as HTMLElement & {
        transforms: Array<Record<string, unknown>>;
      };
      element.transforms = [
        { type: "translate", x: 10, y: 20, z: 0, visible: true },
        { type: "scale", x: 2, y: 2, z: 1, visible: true },
      ];
      element.addEventListener("change", (event) => {
        (window as any).__transformChange = (event as CustomEvent).detail;
      });
      document.body.append(element);
    });

    await page
      .locator('fig-module-transforms fig-button[aria-label="Hide transform"]')
      .first()
      .click();
    let detail = await page.evaluate(() => (window as any).__transformChange);
    expect(detail.values.transform).toBe("scale3d(2, 2, 1)");

    await page
      .locator(
        'fig-module-transforms fig-button[aria-label="Remove transform"]',
      )
      .last()
      .click();
    detail = await page.evaluate(() => (window as any).__transformChange);
    expect(detail.values.transform).toBe("none");
    expect(detail.transforms).toHaveLength(1);
  });
});
