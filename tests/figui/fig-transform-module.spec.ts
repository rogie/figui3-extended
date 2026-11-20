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

  for (const { type, keys, units, initial, next, css } of [
    { type: "translate", keys: ["x", "y", "z"], units: "px", initial: 0, next: 1, css: "translate3d(1px, 1px, 1px)" },
    { type: "rotate", keys: ["x", "y", "z"], units: "°", initial: 0, next: 1, css: "rotateX(1deg) rotateY(1deg) rotateZ(1deg)" },
    { type: "scale", keys: ["x", "y", "z"], units: "%", initial: 100, next: 1.01, css: "scale3d(1.01, 1.01, 1.01)" },
    { type: "skew", keys: ["x", "y"], units: "°", initial: 0, next: 1, css: "skew(1deg, 1deg)" },
    { type: "perspective", keys: ["depth"], units: "px", initial: 1000, next: 1001, css: "perspective(1001px)" },
  ]) {
    test(`${type} fields use correct defaults, units, and single-unit steps`, async ({ page }) => {
      await page.evaluate((type) => {
        const element = document.createElement("fig-module-transforms");
        element.setAttribute("transforms", JSON.stringify([{ type }]));
        document.body.append(element);
      }, type);
      await page.locator('fig-module-transforms fig-button[variant="property"]').click();
      const fields = page.locator('fig-module-transforms dialog[open] fig-input-number');
      await expect(fields).toHaveCount(keys.length);
      for (let index = 0; index < keys.length; index++) {
        const field = fields.nth(index);
        await expect(field).toHaveAttribute("units", units);
        await expect(field).toHaveAttribute("step", "1");
        expect(await field.evaluate((element: any) => Number(element.value))).toBe(initial);
        expect(await field.evaluate((element: any) => Number(element.default))).toBe(initial);
        await field.locator("input").press("ArrowUp");
      }
      const result = await page.locator("fig-module-transforms").evaluate((element: any) => ({
        transform: element.transforms[0],
        css: element.values.transform,
      }));
      for (const key of keys) expect(result.transform[key]).toBe(next);
      expect(result.css).toBe(css);
      await fields.evaluateAll((elements: any[]) => elements.forEach((element) => element.resetToDefault()));
      const reset = await page.locator("fig-module-transforms").evaluate((element: any) => element.transforms[0]);
      for (const key of keys) expect(reset[key]).toBe(type === "scale" ? 1 : initial);
    });
  }

  test("scale percentages hydrate, accept fractional and negative input, and survive reopening", async ({ page }) => {
    await page.evaluate(() => {
      const element = document.createElement("fig-module-transforms");
      element.setAttribute("transforms", JSON.stringify([{ type: "scale", x: 1.5, y: 0.5, z: 2 }]));
      document.body.append(element);
    });
    const trigger = page.locator('fig-module-transforms fig-button[variant="property"]');
    await trigger.click();
    const fields = page.locator('fig-module-transforms dialog fig-input-number');
    for (const [index, value] of [150, 50, 200].entries()) {
      await expect(fields.nth(index).locator("input")).toHaveValue(`${value}%`);
    }
    for (const [index, value] of [125.5, 0, -50].entries()) {
      const input = fields.nth(index).locator("input");
      await input.fill(String(value));
      await input.press("Tab");
    }
    await expect.poll(() => page.locator("fig-module-transforms").evaluate((element: any) => element.values.transform))
      .toBe("scale3d(1.255, 0, -0.5)");
    await page.keyboard.press("Escape");
    await trigger.click();
    for (const [index, value] of [125.5, 0, -50].entries()) {
      await expect(fields.nth(index).locator("input")).toHaveValue(`${value}%`);
    }
  });

  for (const dismissal of ["close button", "Escape", "outside click", "trigger", "programmatic"]) {
    test(`clears transform button selection after ${dismissal}`, async ({ page }) => {
      await page.evaluate(() => {
        const element = document.createElement("fig-module-transforms");
        element.setAttribute("transforms", JSON.stringify([
          { type: "translate" },
          { type: "rotate" },
          { type: "scale" },
          { type: "skew" },
          { type: "perspective" },
        ]));
        document.body.append(element);
      });

      const triggers = page.locator('fig-module-transforms fig-button[variant="property"]');
      for (let index = 0; index < 5; index++) {
        const trigger = triggers.nth(index);
        const popup = page.locator('fig-module-transforms fig-property > dialog').nth(index);
        await trigger.click();
        await expect(popup).toBeVisible();
        await expect(trigger).toHaveAttribute("selected", "");
        await expect(trigger).toHaveAttribute("aria-expanded", "true");

        if (dismissal === "close button") {
          await popup.locator('[aria-label="Close transform editor"]').click();
        } else if (dismissal === "Escape") {
          await page.keyboard.press("Escape");
        } else if (dismissal === "outside click") {
          await page.mouse.click(5, 5);
        } else if (dismissal === "trigger") {
          await trigger.click();
        } else {
          await popup.evaluate((element: any) => { element.open = false; });
        }

        await expect(popup).toBeHidden();
        await expect(trigger).not.toHaveAttribute("selected");
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
      }
    });
  }

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

  test("keeps the transform editor open when switching types", async ({ page }) => {
    await page.addStyleTag({ url: "/fig-editor.css" });
    await page.evaluate(() => document.body.append(document.createElement("fig-module-transforms")));
    const trigger = page.locator('fig-module-transforms fig-button[variant="property"]');
    await trigger.click();
    for (const [type, label, fields] of [
      ["skew", "Skew", 2],
      ["scale", "Scale", 3],
      ["rotate", "Rotate", 3],
      ["perspective", "Perspective", 1],
      ["translate", "Translate", 3],
    ] as const) {
      const popup = page.locator('fig-module-transforms dialog[open]');
      await popup.locator("fig-select").click();
      await page.getByRole("option", { name: label, exact: true }).click();
      await expect(trigger).toHaveText(label);
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(popup).toBeVisible();
      await expect(popup.locator("fig-input-number")).toHaveCount(fields);
      expect(await page.locator("fig-module-transforms").evaluate((element: any) => element.transforms[0].type)).toBe(type);
    }
    await page.keyboard.press("Escape");
    await expect(trigger).not.toHaveAttribute("selected");
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
