import { expect, test } from "@playwright/test";
import { bootFigFixture, collectPageErrors } from "./helpers";

test.describe("fig-font-picker", () => {
  test.beforeEach(async ({ page }) => {
    collectPageErrors(page);
    await page.route("https://fonts.googleapis.com/**", (route) =>
      route.abort("blockedbyclient"),
    );
    await page.route("https://fonts.gstatic.com/**", (route) =>
      route.abort("blockedbyclient"),
    );
    await bootFigFixture(page);
    await page.addScriptTag({ type: "module", url: "/fig-editor.js" });
    await page.addStyleTag({ url: "/fig-editor.css" });
    await page.evaluate(() => customElements.whenDefined("fig-font-picker"));
  });

  test("uses FigUI controls and normalizes value/default state", async ({
    page,
  }) => {
    const state = await page.evaluate(async () => {
      const root = document.querySelector("#fixture-root")!;
      root.innerHTML = `
        <fig-font-picker
          label="Typeface"
          value="Inter"
          default="Georgia"
          options="Inter,Georgia"
          local-fonts="false"
          google-fonts="false"
        ></fig-font-picker>
      `;
      await new Promise(requestAnimationFrame);
      const picker = root.querySelector("fig-font-picker") as HTMLElement & {
        value: { family: string; axes: Record<string, number> };
        defaultValue: { family: string; axes: Record<string, number> };
        isDefault: boolean;
        resetToDefault(): void;
        open(): void;
      };
      picker.open();
      await new Promise(requestAnimationFrame);
      const trigger = picker.querySelector(
        ".fig-font-picker-surface > fig-select",
      );
      const tags = [...picker.querySelectorAll("*")].map((node) =>
        node.localName,
      );
      const initial = {
        value: picker.value,
        defaultValue: picker.defaultValue,
        isDefault: picker.isDefault,
      };
      picker.resetToDefault();
      return {
        initial,
        reset: { value: picker.value, isDefault: picker.isDefault },
        hasToolkitTag: tags.some((tag) => tag.startsWith("tk-")),
        hasFigSelect: tags.includes("fig-select"),
        hasFigInput: tags.includes("fig-input-text"),
        hasFigChooser: tags.includes("fig-chooser"),
        toolbarTag: picker.querySelector(".fig-font-picker-toolbar")?.localName,
        toolbarBorderless: picker
          .querySelector(".fig-font-picker-toolbar")
          ?.hasAttribute("borderless"),
        surfaceChildCount:
          picker.querySelector(".fig-font-picker-surface")?.childElementCount,
        triggerVariant: trigger?.getAttribute("variant"),
        triggerLabel: trigger?.getAttribute("label"),
        triggerAriaLabel: trigger?.getAttribute("aria-label"),
        chooserOverflow: picker
          .querySelector("fig-chooser")
          ?.getAttribute("overflow"),
        chooserAutoScroll: picker
          .querySelector("fig-chooser")
          ?.getAttribute("auto-scroll"),
        largeOptions: [
          ...picker.querySelectorAll(".fig-font-picker-option"),
        ].every((option) => option.getAttribute("size") === "large"),
        optionGap: getComputedStyle(
          picker.querySelector(".fig-font-picker-option")!,
        ).gap,
        optionSlots: [
          ...picker.querySelectorAll(".fig-font-picker-option"),
        ].every(
          (option) =>
            option.querySelector(
              ':scope > fig-icon.fig-font-picker-selected-icon[slot="prepend"]',
            ) &&
            option.querySelector(
              ':scope > fig-icon.fig-font-picker-favorite[slot="append"]',
            ),
        ),
        searchIconCount:
          picker.querySelector(".fig-font-picker-search")?.querySelectorAll(
            ":scope > fig-icon",
          ).length ?? 0,
        dialogOpen: Boolean(
          picker.querySelector(".fig-font-picker-dialog")?.hasAttribute("open"),
        ),
      };
    });

    expect(state).toEqual({
      initial: {
        value: { family: "Inter", axes: {} },
        defaultValue: { family: "Georgia", axes: {} },
        isDefault: false,
      },
      reset: {
        value: { family: "Georgia", axes: {} },
        isDefault: true,
      },
      hasToolkitTag: false,
      hasFigSelect: true,
      hasFigInput: true,
      hasFigChooser: true,
      toolbarTag: "fig-header",
      toolbarBorderless: true,
      surfaceChildCount: 1,
      triggerVariant: null,
      triggerLabel: null,
      triggerAriaLabel: "Typeface",
      chooserOverflow: "scrollbar",
      chooserAutoScroll: "false",
      largeOptions: true,
      optionGap: "4px",
      optionSlots: true,
      searchIconCount: 1,
      dialogOpen: true,
    });

    const favoritesOnly = page.locator(
      ".fig-font-picker-favorites-only",
    );
    const favoritesIcon = favoritesOnly.locator(
      ".fig-font-picker-favorite-icon",
    );
    await expect(favoritesIcon).toHaveAttribute("name", "save");
    await expect(favoritesIcon).not.toHaveCSS("mask-image", "none");
    await favoritesOnly.click();
    await expect(favoritesOnly).toHaveAttribute("aria-pressed", "true");
    await expect(favoritesIcon).toHaveAttribute("name", "saved");
    await favoritesOnly.click();
  });

  test("searches, selects, filters, and emits FigUI value detail", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const root = document.querySelector("#fixture-root")!;
      root.innerHTML = `
        <fig-font-picker
          value="Inter"
          minimal="false"
          local-fonts="false"
          google-fonts="false"
          options='[
            {"family":"Inter","category":"sans-serif"},
            {"family":"Georgia","category":"serif"},
            {"family":"IBM Plex Mono","category":"monospace"}
          ]'
        ></fig-font-picker>
      `;
      (root.firstElementChild as HTMLElement & { open(): void }).open();
    });

    const picker = page.locator("fig-font-picker");
    const dialog = picker.locator(".fig-font-picker-dialog");
    await expect(dialog).toHaveAttribute("open", "true");
    const initialOption = dialog.locator(
      '[data-font-option-id="family:Inter"]',
    );
    const initialOtherOption = dialog.locator(
      '[data-font-option-id="family:Georgia"]',
    );
    await expect(initialOption).toHaveAttribute("selected", "");
    await expect(initialOption).toHaveAttribute("aria-selected", "true");
    await expect(
      initialOption.locator(".fig-font-picker-selected-icon"),
    ).toHaveCSS("visibility", "visible");
    await expect(
      initialOtherOption.locator(".fig-font-picker-selected-icon"),
    ).toHaveCSS("visibility", "hidden");
    const optionBackgrounds = await dialog
      .locator('[data-font-option-id="family:Inter"], [data-font-option-id="family:Georgia"]')
      .evaluateAll((options) =>
        options.map((option) => getComputedStyle(option).backgroundColor),
      );
    expect(optionBackgrounds[0]).not.toBe(optionBackgrounds[1]);

    const search = dialog.locator("fig-input-text");
    await search.evaluate((element: HTMLElement & { value: string }) => {
      element.value = "Georgia";
      element.dispatchEvent(
        new CustomEvent("input", {
          bubbles: true,
          composed: true,
          detail: "Georgia",
        }),
      );
    });
    await expect(dialog.locator(".fig-font-picker-family")).toHaveCount(1);

    const eventDetail = await picker.evaluate(async (element) => {
      const host = element as HTMLElement & {
        value: { family: string };
      };
      const detail = await new Promise<unknown>((resolve) => {
        host.addEventListener(
          "change",
          (event) => resolve((event as CustomEvent).detail),
          { once: true },
        );
        (
          host.querySelector(
            '[data-font-option-id="family:Georgia"]',
          ) as HTMLElement
        ).click();
      });
      return { detail, family: host.value.family };
    });
    expect(eventDetail).toMatchObject({
      family: "Georgia",
      detail: {
        value: { family: "Georgia", axes: {} },
        family: "Georgia",
        axes: {},
      },
    });
    const selectedOption = dialog.locator(
      '[data-font-option-id="family:Georgia"]',
    );
    await expect(selectedOption).toHaveAttribute("selected", "");
    await expect(selectedOption).toHaveAttribute("aria-selected", "true");
    await expect(
      selectedOption.locator(".fig-font-picker-selected-icon"),
    ).toHaveCSS("visibility", "visible");

    await search.evaluate((element: HTMLElement & { value: string }) => {
      element.value = "";
      element.dispatchEvent(
        new CustomEvent("input", {
          bubbles: true,
          composed: true,
          detail: "",
        }),
      );
    });
    await dialog
      .locator(".fig-font-picker-source")
      .evaluate((element: HTMLElement & { value: string }) => {
        element.value = "category:serif";
        element.dispatchEvent(
          new CustomEvent("change", {
            bubbles: true,
            composed: true,
            detail: "category:serif",
          }),
        );
      });
    await expect(dialog.locator(".fig-font-picker-family")).toHaveCount(2);
    await expect(
      dialog.locator('[data-font-option-id="family:Georgia"]'),
    ).toHaveCount(1);
  });

  test("persists favorites and exposes a favorites tab in full mode", async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.removeItem("figui3:font-favorites");
      const root = document.querySelector("#fixture-root")!;
      root.innerHTML =
        '<fig-font-picker minimal="false" options="Inter,Georgia" local-fonts="false" google-fonts="false"></fig-font-picker>';
      (root.firstElementChild as HTMLElement & { open(): void }).open();
    });
    const picker = page.locator("fig-font-picker");
    await expect(picker.locator(".fig-font-picker-source")).toHaveCSS(
      "height",
      "24px",
    );
    await picker
      .locator('[data-font-option-id="family:Inter"]')
      .hover();
    const favoriteButton = picker.locator('[data-favorite-family="Inter"]');
    await expect(favoriteButton).toHaveAttribute("name", "save");
    await favoriteButton.click();
    await expect(
      picker.locator('[data-favorite-family="Inter"]'),
    ).toHaveAttribute("name", "saved");
    await expect(
      picker.locator('.fig-font-picker-tabs fig-tab[value="favorites"]'),
    ).toHaveCount(1);
    await picker
      .locator('.fig-font-picker-tabs fig-tab[value="favorites"]')
      .click();
    await expect(picker.locator(".fig-font-picker-panel").first()).toBeHidden();
    await expect(picker.locator(".fig-font-picker-panel").nth(1)).toBeVisible();
    await expect(
      picker.locator(".fig-font-picker-panel").nth(1).locator(
        ".fig-font-picker-family",
      ),
    ).toHaveCount(1);
    await expect(
      picker.locator(".fig-font-picker-panel").nth(1).locator(
        ".fig-font-picker-family",
      ),
    ).toHaveAttribute("data-family", "Inter");
    const state = await picker.evaluate(
      (element: HTMLElement & { favorites: string[] }) => ({
        favorites: element.favorites,
        stored: JSON.parse(
          localStorage.getItem("figui3:font-favorites") || "[]",
        ),
      }),
    );
    expect(state).toEqual({ favorites: ["Inter"], stored: ["inter"] });
  });

  test("honors disabled state, focus, positioning, and keyboard navigation", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const root = document.querySelector("#fixture-root")!;
      root.innerHTML =
        '<fig-font-picker disabled options="Inter,Georgia,serif" local-fonts="false" google-fonts="false"></fig-font-picker>';
    });
    const picker = page.locator("fig-font-picker");
    const dialog = picker.locator(".fig-font-picker-dialog");
    await picker.evaluate((element: HTMLElement & { open(): void }) =>
      element.open(),
    );
    await expect(dialog).not.toHaveAttribute("open");

    await picker.evaluate((element) => element.removeAttribute("disabled"));
    await picker.locator(".fig-font-picker-surface fig-select").click();
    await expect(dialog).toHaveAttribute("open", "true");
    await expect(dialog).toHaveAttribute("autoresize", "false");
    await expect(dialog.locator("fig-input-text input")).toBeFocused();

    const [pickerBox, dialogBox] = await Promise.all([
      picker.boundingBox(),
      dialog.boundingBox(),
    ]);
    expect(dialogBox?.x).toBeCloseTo(pickerBox?.x ?? 0, 0);
    expect(dialogBox?.y).toBeCloseTo(
      (pickerBox?.y ?? 0) + (pickerBox?.height ?? 0) + 8,
      0,
    );

    const options = dialog.locator("[data-font-option-id]");
    await options.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toBeFocused();

    await picker.evaluate((element: HTMLElement & { close(): void }) =>
      element.close(),
    );
    await expect(dialog).not.toHaveAttribute("open");
    await expect(
      picker.locator(".fig-font-picker-surface fig-select"),
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("reports Local Font Access denial without losing generic fonts", async ({
    page,
  }) => {
    const state = await page.evaluate(async () => {
      Object.defineProperty(globalThis, "queryLocalFonts", {
        configurable: true,
        value: async () => {
          throw new DOMException("Denied", "NotAllowedError");
        },
      });
      const picker = document.createElement("fig-font-picker") as HTMLElement & {
        open(): void;
        fonts: Array<{ family: string }>;
      };
      picker.setAttribute("google-fonts", "false");
      document.body.append(picker);
      picker.open();
      await new Promise((resolve) => setTimeout(resolve, 0));
      return {
        status: picker.querySelector(".fig-font-picker-status")?.textContent,
        generic: picker.fonts.some((font) => font.family === "system-ui"),
      };
    });
    expect(state.status).toContain("not granted");
    expect(state.generic).toBe(true);
  });

  test("exposes Google resource metadata without stylesheet injection", async ({
    page,
  }) => {
    const resource = await page.evaluate(async () => {
      const picker = document.createElement("fig-font-picker") as HTMLElement & {
        selectedResource: Record<string, unknown> | null;
        fonts: Array<{ family: string; sources: string[] }>;
      };
      picker.setAttribute("value", "Roboto");
      picker.setAttribute("local-fonts", "false");
      picker.setAttribute("google-font-limit", "1");
      document.body.append(picker);
      await new Promise(requestAnimationFrame);
      return {
        resource: picker.selectedResource,
        hasRoboto: picker.fonts.some(
          (font) =>
            font.family === "Roboto" && font.sources.includes("google"),
        ),
        stylesheetCount: document.querySelectorAll(
          'link[href*="fonts.googleapis.com"],style[data-google-font]',
        ).length,
      };
    });
    expect(resource).toMatchObject({
      hasRoboto: true,
      stylesheetCount: 0,
      resource: {
        provider: "google-fonts",
        family: "Roboto",
        stylesheetUrl: expect.stringContaining(
          "https://fonts.googleapis.com/css2?family=Roboto",
        ),
      },
    });
  });

  test("parses OpenType variable axes without dependencies", async ({ page }) => {
    const parsed = await page.evaluate(async () => {
      const { parseOpenTypeFont } = await import(
        "/src/editor/runtime/fonts.js"
      );
      const buffer = new ArrayBuffer(64);
      const view = new DataView(buffer);
      view.setUint32(0, 0x00010000, false);
      view.setUint16(4, 1, false);
      for (const [index, character] of [..."fvar"].entries()) {
        view.setUint8(12 + index, character.charCodeAt(0));
      }
      view.setUint32(20, 28, false);
      view.setUint32(24, 36, false);
      view.setUint16(28, 1, false);
      view.setUint16(30, 0, false);
      view.setUint16(32, 16, false);
      view.setUint16(34, 2, false);
      view.setUint16(36, 1, false);
      view.setUint16(38, 20, false);
      view.setUint16(40, 0, false);
      view.setUint16(42, 8, false);
      for (const [index, character] of [..."wdth"].entries()) {
        view.setUint8(44 + index, character.charCodeAt(0));
      }
      view.setInt32(48, 50 * 65536, false);
      view.setInt32(52, 100 * 65536, false);
      view.setInt32(56, 200 * 65536, false);
      view.setUint16(60, 0, false);
      view.setUint16(62, 256, false);
      return parseOpenTypeFont(buffer);
    });
    expect(parsed.axes).toEqual([
      { tag: "wdth", name: "wdth", min: 50, default: 100, max: 200 },
    ]);
  });
});
