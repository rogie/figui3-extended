import { expect, test } from "@playwright/test";
import { bootFigFixture } from "./helpers";

test.describe("fig-module-filters", () => {
  test.beforeEach(async ({ page }) => {
    await bootFigFixture(page);
    await page.evaluate(() => import("/fig-editor.js"));
    await page.evaluate(() => customElements.whenDefined("fig-module-filters"));
  });

  test("hydrates an ordered SVG-derived filter stack", async ({ page }) => {
    const result = await page.evaluate(() => {
      const element = document.createElement("fig-module-filters") as HTMLElement & {
        filters: Array<Record<string, unknown>>;
        values: Record<string, string>;
      };
      element.filters = [
        {
          type: "gaussian-blur",
          primitive: "feGaussianBlur",
          radius: 8,
          visible: true,
        },
        {
          type: "hue-rotate",
          primitive: "feColorMatrix",
          angle: 45,
          visible: true,
        },
      ];
      document.body.append(element);
      return {
        filters: element.filters,
        values: element.values,
        rows: element.querySelectorAll("fig-property").length,
        propertySelects: element.querySelectorAll(
          'fig-property > fig-stack[slot="input"] > fig-select',
        ).length,
        numberInputs: element.querySelectorAll(
          'fig-property > fig-stack[slot="input"] > fig-input-number',
        ).length,
      };
    });

    expect(result.filters.map((filter) => filter.primitive)).toEqual([
      "feGaussianBlur",
      "feColorMatrix",
    ]);
    expect(result.values.filter).toBe("blur(8px) hue-rotate(45deg)");
    expect(result.rows).toBe(2);
    expect(result.propertySelects).toBe(2);
    expect(result.numberInputs).toBe(2);
  });

  test("visibility and removal update the mapped filter value", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const element = document.createElement("fig-module-filters") as HTMLElement & {
        filters: Array<Record<string, unknown>>;
      };
      element.filters = [
        { type: "gaussian-blur", radius: 4, visible: true },
        { type: "saturate", amount: 1.5, visible: true },
      ];
      element.addEventListener("change", (event) => {
        (window as any).__filterChange = (event as CustomEvent).detail;
      });
      document.body.append(element);
    });

    await page
      .locator('fig-module-filters fig-button[aria-label="Hide filter"]')
      .first()
      .click();
    let detail = await page.evaluate(() => (window as any).__filterChange);
    expect(detail.values.filter).toBe("saturate(1.5)");

    await page
      .locator('fig-module-filters fig-button[aria-label="Remove filter"]')
      .last()
      .click();
    detail = await page.evaluate(() => (window as any).__filterChange);
    expect(detail.values.filter).toBe("none");
    expect(detail.filters).toHaveLength(1);
  });

  test("focuses the value input of a newly added inline filter", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.body.append(document.createElement("fig-module-filters"));
    });

    await page
      .locator('fig-module-filters fig-button[aria-label="Add filter"]')
      .click();
    await page
      .locator('fig-menu-item[value="layer:gaussian-blur"]')
      .click();

    const rows = page.locator("fig-module-filters fig-reorder > fig-property");
    await expect(rows).toHaveCount(2);
    const valueInput = rows.last().locator("fig-input-number");
    await expect
      .poll(() =>
        valueInput.evaluate(
          (element) =>
            element === document.activeElement ||
            element.matches(":focus-within"),
        ),
      )
      .toBe(true);
  });

  test("provides every inline layer and backdrop editor", async ({ page }) => {
    const result = await page.evaluate(() => {
      const types = [
        ["gaussian-blur", { radius: 6 }],
        ["brightness", { amount: 1.2 }],
        ["contrast", { amount: 0.8 }],
        ["grayscale", { amount: 0.5 }],
        ["hue-rotate", { angle: 90 }],
        ["invert", { amount: 0.25 }],
        ["saturate", { amount: 1.5 }],
        ["sepia", { amount: 0.6 }],
      ] as const;
      const element = document.createElement("fig-module-filters") as HTMLElement & {
        filters: Array<Record<string, unknown>>;
        values: Record<string, string>;
      };
      element.filters = ["layer", "backdrop"].flatMap((target) =>
        types.map(([type, values]) => ({
          target,
          type,
          ...values,
          visible: true,
        })),
      );
      document.body.append(element);
      return {
        values: element.values,
        rows: element.querySelectorAll("fig-property").length,
        dialogs: element.querySelectorAll('dialog[is="fig-popup"]').length,
        editors: element.querySelectorAll(
          'fig-property > fig-stack[slot="input"] > fig-input-number',
        ).length,
        units: Array.from(
          element.querySelectorAll(
            'fig-property > fig-stack[slot="input"] > fig-input-number',
          ),
          (input) => input.getAttribute("units"),
        ),
        menuValues: Array.from(
          element.querySelectorAll("fig-menu > fig-menu-item[value]"),
          (item) => item.getAttribute("value"),
        ),
        editorValues: Array.from(
          element
            .querySelector('fig-property > fig-stack[slot="input"] > fig-select')!
            .querySelectorAll("fig-select-option[value]"),
          (item) => item.getAttribute("value"),
        ),
      };
    });

    const serialized =
      "blur(6px) brightness(1.2) contrast(0.8) grayscale(0.5) " +
      "hue-rotate(90deg) invert(0.25) saturate(1.5) sepia(0.6)";
    expect(result.values.filter).toBe(serialized);
    expect(result.values["backdrop-filter"]).toBe(serialized);
    expect(result.rows).toBe(16);
    expect(result.dialogs).toBe(0);
    expect(result.editors).toBe(16);
    expect(result.units).toContain("px");
    expect(result.units).toContain("°");
    expect(result.units).toContain("%");
    expect(result.menuValues).toHaveLength(16);
    expect(result.menuValues).toContain("layer:grayscale");
    expect(result.menuValues).toContain("backdrop:sepia");
    expect(result.editorValues).toHaveLength(16);
    expect(result.editorValues).toContain("backdrop:brightness");
  });
});
