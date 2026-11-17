import { expect, test } from "@playwright/test";
import { editorComponentContracts } from "../../playground/src/testing/componentManifest";
import {
  bootFigFixture,
  collectPageErrors,
  getContractElementCount,
  mountContract,
  runAttributeContract,
  runEventContract,
  runPropertyContract,
  waitForComponentDefinitions,
} from "./helpers";

test.describe("editor component manifest contracts", () => {
  test.beforeEach(async ({ page }) => {
    collectPageErrors(page);
    await bootFigFixture(page);
    await page.evaluate(() => import("/fig-editor.js"));
    await waitForComponentDefinitions(page, editorComponentContracts);
  });

  test("registers every editor component in the manifest", async ({ page }) => {
    const missing = await page.evaluate(
      (tags) => tags.filter((tag) => !customElements.get(tag)),
      editorComponentContracts.map((contract) => contract.tag),
    );
    expect(missing).toEqual([]);
  });

  test("every module element applies the shared module class", async ({
    page,
  }) => {
    const moduleTags = editorComponentContracts
      .map((contract) => contract.tag)
      .filter((tag) => tag.startsWith("fig-module-"));
    const classes = await page.evaluate((tags) => {
      const host = document.createElement("div");
      document.body.append(host);
      return tags.map((tag) => {
        const element = document.createElement(tag);
        host.append(element);
        return {
          tag,
          isModule: element.classList.contains("fig-module"),
        };
      });
    }, moduleTags);
    expect(classes).toEqual(
      moduleTags.map((tag) => ({ tag, isModule: true })),
    );
  });

  test("empty list modules render only their header", async ({ page }) => {
    const children = await page.evaluate(() => {
      const definitions = [
        ["fig-module-fills", "fills"],
        ["fig-module-filters", "filters"],
        ["fig-module-transforms", "transforms"],
      ];
      return definitions.map(([tag, attribute]) => {
        const element = document.createElement(tag);
        element.setAttribute(attribute, "[]");
        document.body.append(element);
        const group = element.querySelector("fig-group");
        return {
          tag,
          children: Array.from(
            group?.children ?? [],
            (child) => child.tagName.toLowerCase(),
          ),
        };
      });
    });
    expect(children).toEqual([
      { tag: "fig-module-fills", children: ["fig-header"] },
      { tag: "fig-module-filters", children: ["fig-header"] },
      { tag: "fig-module-transforms", children: ["fig-header"] },
    ]);
  });

  for (const contract of editorComponentContracts) {
    test(`${contract.tag}: mounts without runtime errors`, async ({ page }) => {
      const errors = collectPageErrors(page);
      await mountContract(page, contract);
      await expect
        .poll(() => getContractElementCount(page, contract))
        .toBeGreaterThan(0);
      expect(errors.pageErrors).toEqual([]);
      expect(errors.consoleErrors).toEqual([]);
    });

    for (const attribute of contract.attributes ?? []) {
      test(`${contract.tag}: ${attribute.name} attribute`, async ({ page }) => {
        await mountContract(page, contract);
        const actual = await runAttributeContract(
          page,
          contract,
          attribute.attribute,
          attribute.value,
        );
        expect(actual).toBe(attribute.expected ?? attribute.value);
      });
    }

    for (const property of contract.properties ?? []) {
      test(`${contract.tag}: ${property.name}`, async ({ page }) => {
        await mountContract(page, contract);
        const actual = await runPropertyContract(
          page,
          contract,
          property.property,
          property.value,
        );
        expect(actual).toEqual(property.expected);
      });
    }

    for (const eventContract of contract.events ?? []) {
      test(`${contract.tag}: ${eventContract.name}`, async ({ page }) => {
        await mountContract(page, contract);
        const events = await runEventContract(page, contract, eventContract);
        expect(events.length).toBeGreaterThan(0);
        expect(events.at(-1)).toMatchObject({
          type: eventContract.event,
          ...("expectedDetail" in eventContract
            ? { detail: eventContract.expectedDetail }
            : {}),
        });
      });
    }
  }
});
