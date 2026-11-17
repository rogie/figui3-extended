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
          'fig-property > fig-stack[slot="input"] > fig-tooltip > fig-select',
        ).length,
        numberInputs: element.querySelectorAll(
          'fig-property > fig-stack[slot="input"] > fig-tooltip > fig-input-number',
        ).length,
        tooltips: element.querySelectorAll(
          "fig-property > fig-stack > fig-tooltip",
        ).length,
        blurIcon: element
          .querySelector(
            'fig-input-number[aria-label="Blur value"] fig-icon[slot="prepend"] svg path',
          )
          ?.getAttribute("d"),
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
    expect(result.tooltips).toBe(8);
    expect(result.blurIcon).toMatch(/^M6\.5 17C/);
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
    await expect(
      page.locator('fig-module-filters fig-reorder[aria-label="Layer filters"]'),
    ).toHaveAttribute(
      "handle",
      'fig-icon[slot="leading"][name="drag-handle"]',
    );
    await expect(
      rows.locator(
        ':scope > fig-icon[slot="leading"][name="drag-handle"][data-reorder-handle]',
      ),
    ).toHaveCount(2);
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

  test("separates layer and backdrop filters into independent reorder lists", async ({
    page,
  }) => {
    const result = await page.evaluate(() => {
      const element = document.createElement("fig-module-filters") as HTMLElement & {
        filters: Array<Record<string, unknown>>;
      };
      element.filters = [
        { target: "layer", type: "gaussian-blur", radius: 4 },
        { target: "backdrop", type: "brightness", amount: 1.2 },
        { target: "layer", type: "sepia", amount: 0.5 },
        { target: "backdrop", type: "contrast", amount: 0.8 },
      ];
      document.body.append(element);

      const reorders = Array.from(element.querySelectorAll("fig-reorder"));
      const backdropSeparator = element.querySelector(
        ':scope > fig-group > fig-separator[label="Backdrop"]',
      );
      reorders[0].dispatchEvent(
        new CustomEvent("reorder", {
          bubbles: true,
          detail: { oldIndex: 0, newIndex: 1 },
        }),
      );

      return {
        reorderLabels: reorders.map((reorder) =>
          reorder.getAttribute("aria-label"),
        ),
        rowCounts: reorders.map(
          (reorder) => reorder.querySelectorAll(":scope > fig-property").length,
        ),
        hasBackdropSeparator: Boolean(backdropSeparator),
        filters: element.filters.map((filter) => ({
          target: filter.target,
          type: filter.type,
        })),
      };
    });

    expect(result.reorderLabels).toEqual(["Layer filters", "Backdrop filters"]);
    expect(result.rowCounts).toEqual([2, 2]);
    expect(result.hasBackdropSeparator).toBe(true);
    expect(result.filters).toEqual([
      { target: "layer", type: "sepia" },
      { target: "backdrop", type: "brightness" },
      { target: "layer", type: "gaussian-blur" },
      { target: "backdrop", type: "contrast" },
    ]);
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
          'fig-property > fig-stack[slot="input"] > fig-tooltip > fig-input-number',
        ).length,
        units: Array.from(
          element.querySelectorAll(
            'fig-property > fig-stack[slot="input"] > fig-tooltip > fig-input-number',
          ),
          (input) => input.getAttribute("units"),
        ),
        menuValues: Array.from(
          element.querySelectorAll("fig-menu > fig-menu-item[value]"),
          (item) => item.getAttribute("value"),
        ),
        editorValues: Array.from(
          element
            .querySelector('fig-property > fig-stack[slot="input"] > fig-tooltip > fig-select')!
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
