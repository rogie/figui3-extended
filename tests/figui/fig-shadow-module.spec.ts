import { expect, test } from "@playwright/test";
import { bootFigFixture } from "./helpers";

test.describe("fig-module-shadows", () => {
  test.beforeEach(async ({ page }) => {
    await bootFigFixture(page);
    await page.evaluate(() => import("/fig-editor.js"));
    await page.evaluate(() => customElements.whenDefined("fig-module-shadows"));
  });

  test("hydrates shadow types and maps them to CSS properties", async ({
    page,
  }) => {
    const result = await page.evaluate(() => {
      const element = document.createElement("fig-module-shadows") as HTMLElement & {
        shadows: Array<Record<string, unknown>>;
        values: Record<string, string>;
      };
      element.shadows = [
        {
          type: "drop",
          x: 0,
          y: 4,
          blur: 8,
          spread: -1,
          color: "#00000040",
          visible: true,
        },
        {
          type: "inner",
          x: 0,
          y: 1,
          blur: 2,
          spread: 0,
          color: "#ff000080",
          visible: true,
        },
        {
          type: "text",
          x: 1,
          y: 2,
          blur: 3,
          color: "#00000080",
          visible: true,
        },
      ];
      document.body.append(element);
      return {
        shadows: element.shadows,
        values: element.values,
        rows: element.querySelectorAll("fig-property").length,
        triggers: element.querySelectorAll(
          'fig-button[variant="property"][aria-haspopup="dialog"]',
        ).length,
        editors: element.querySelectorAll('dialog[is="fig-popup"]').length,
      };
    });

    expect(result.values["box-shadow"]).toBe(
      "0px 4px 8px -1px #00000040, 0px 1px 2px 0px #ff000080 inset",
    );
    expect(result.values["text-shadow"]).toBe("1px 2px 3px #00000080");
    expect(result.shadows[2]).not.toHaveProperty("spread");
    expect(result.rows).toBe(3);
    expect(result.triggers).toBe(3);
    expect(result.editors).toBe(3);
  });

  test("opens the row editor with fields appropriate to its type", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const element = document.createElement("fig-module-shadows") as HTMLElement & {
        shadows: Array<Record<string, unknown>>;
      };
      element.shadows = [
        {
          type: "drop",
          x: 0,
          y: 4,
          blur: 4,
          spread: 0,
          color: "#00000040",
          visible: true,
        },
        {
          type: "text",
          x: 0,
          y: 2,
          blur: 4,
          color: "#00000040",
          visible: true,
        },
      ];
      document.body.append(element);
    });

    const triggers = page.locator(
      'fig-module-shadows fig-button[variant="property"]',
    );
    await expect(triggers.locator('fig-icon[slot="prepend"]')).toHaveCount(0);
    await triggers.first().click();
    await expect(
      page.locator(
        'fig-module-shadows dialog[open] > fig-header[dialog-header]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator(
        'fig-module-shadows dialog[open] > fig-header[dialog-header][data-auto]',
      ),
    ).toHaveCount(0);
    await expect(
      page.locator('fig-module-shadows dialog[open] fig-field label', {
        hasText: "Spread",
      }),
    ).toHaveCount(1);

    await page.keyboard.press("Escape");
    await triggers.last().click();
    await expect(
      page.locator('fig-module-shadows dialog[open] fig-field label', {
        hasText: "Spread",
      }),
    ).toHaveCount(0);
  });

  test("opens a newly added shadow editor", async ({ page }) => {
    await page.evaluate(() => {
      document.body.append(document.createElement("fig-module-shadows"));
    });

    await page
      .locator('fig-module-shadows fig-button[aria-label="Add shadow"]')
      .click();
    await page.locator('fig-menu-item[value="inner"]').click();

    const rows = page.locator("fig-module-shadows fig-reorder > fig-property");
    await expect(rows).toHaveCount(2);
    await expect(
      rows.last().locator(':scope > dialog[is="fig-popup"]'),
    ).toHaveAttribute("open", "true");
    await expect(
      rows.last().locator('fig-button[aria-haspopup="dialog"]'),
    ).toHaveAttribute("aria-expanded", "true");
  });

  test("visibility and removal update mapped values", async ({ page }) => {
    await page.evaluate(() => {
      const element = document.createElement("fig-module-shadows") as HTMLElement & {
        shadows: Array<Record<string, unknown>>;
      };
      element.shadows = [
        {
          type: "drop",
          x: 0,
          y: 4,
          blur: 4,
          spread: 0,
          color: "#00000040",
          visible: true,
        },
        {
          type: "text",
          x: 0,
          y: 2,
          blur: 4,
          color: "#00000040",
          visible: true,
        },
      ];
      element.addEventListener("change", (event) => {
        (window as any).__shadowChange = (event as CustomEvent).detail;
      });
      document.body.append(element);
    });

    await page
      .locator('fig-module-shadows fig-button[aria-label="Hide shadow"]')
      .first()
      .click();
    let detail = await page.evaluate(() => (window as any).__shadowChange);
    expect(detail.values["box-shadow"]).toBe("none");
    expect(detail.values["text-shadow"]).toBe("0px 2px 4px #00000040");

    await page
      .locator('fig-module-shadows fig-button[aria-label="Remove shadow"]')
      .last()
      .click();
    detail = await page.evaluate(() => (window as any).__shadowChange);
    expect(detail.values["text-shadow"]).toBe("none");
    expect(detail.shadows).toHaveLength(1);
  });
});
