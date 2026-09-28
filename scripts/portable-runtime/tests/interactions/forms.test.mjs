import { describe, expect, it } from "vitest";
import { chromium } from "playwright";
import {
  validateFilteredResults,
  validateFormOutcome,
  validateFormReset,
  validateNavigationChange,
  waitForSubmitReadiness,
} from "../../runtime-performance/interactions/driver.mjs";

const expectedSelect = { initial: "option-1", chosen: "option-4" };
const expectedCombobox = { chosen: "item-042", chosenLabel: "Item 042", matches: 10 };
const validForm = {
  selectedValue: "option-4",
  submittedValue: "option-4",
  formValue: "option-4",
  expanded: "false",
  focusAfterChoose: true,
};

describe("form fixture endpoints", () => {
  it("waits for a delayed popup to stop intercepting the trusted submit click", async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(`
        <style>
          #stage { position: relative; width: 300px; height: 300px }
          [data-bench="submit"], [data-bench="popup"] {
            position: absolute; left: 80px; top: 120px; width: 140px; height: 40px;
          }
          [data-bench="popup"] { z-index: 2 }
          [hidden] { display: none }
        </style>
        <div id="stage">
          <button data-bench="submit">Submit</button>
          <div data-bench="popup" data-item="item-042" role="option">Item 042</div>
        </div>
        <script>
          window.__bench = { drain: () => undefined };
          window.clicks = [];
          document.addEventListener("click", (event) => {
            window.clicks.push({
              trusted: event.isTrusted,
              bench: event.target.closest("[data-bench]")?.getAttribute("data-bench") ?? null,
              item: event.target.closest("[data-item]")?.getAttribute("data-item") ?? null,
            });
          }, true);
          setTimeout(() => document.querySelector('[data-bench="popup"]').hidden = true, 120);
        </script>
      `);
      const button = await page.locator('[data-bench="submit"]').boundingBox();
      const point = { x: button.x + button.width / 2, y: button.y + button.height / 2 };
      await page.mouse.click(point.x, point.y);
      expect(await page.evaluate(() => window.clicks.at(-1))).toMatchObject({
        trusted: true,
        bench: "popup",
        item: "item-042",
      });
      const readiness = await waitForSubmitReadiness(page);
      await page.mouse.click(point.x, point.y);
      expect(readiness).toMatchObject({
        ready: true,
        popupConnected: true,
        popupHidden: true,
        hitTarget: { bench: "submit", item: null, tag: "BUTTON" },
        excludedFromActionTiming: true,
      });
      expect(await page.evaluate(() => window.clicks.at(-1))).toMatchObject({
        trusted: true,
        bench: "submit",
        item: null,
      });
    } finally {
      await browser.close();
    }
  });

  it("classifies a persistently intercepted submit target as a driver failure", async () => {
    const page = {
      evaluate: async (callback) =>
        callback.name === "submitTargetState"
          ? {
              ready: false,
              popupConnected: true,
              popupHidden: false,
              hitTarget: { item: "item-042" },
            }
          : undefined,
      waitForFunction: async () => {
        throw new Error("timeout");
      },
    };
    await expect(waitForSubmitReadiness(page, { timeoutMs: 1 })).rejects.toMatchObject({
      category: "driver-failure",
      message: expect.stringContaining("Submit target remained intercepted"),
    });
  });

  it("accepts a changed controlled value with native form output", () => {
    expect(validateFormOutcome(validForm, expectedSelect)).toEqual([]);
  });

  it("rejects a frozen controlled value through the runner endpoint contract", () => {
    expect(
      validateFormOutcome(
        {
          ...validForm,
          selectedValue: "option-1",
          submittedValue: "option-1",
          formValue: "option-1",
        },
        expectedSelect,
      ),
    ).toEqual(["host selected option-1", "submitted option-1", "FormData contained option-1"]);
  });

  it("rejects incorrect filtered results through the runner endpoint contract", () => {
    const filteredItems = Array.from(
      { length: 9 },
      (_, index) => `item-${String(40 + index).padStart(3, "0")}`,
    );
    expect(
      validateFilteredResults(
        {
          ...validForm,
          selectedValue: "item-042",
          submittedValue: "item-042",
          formValue: "item-042",
          inputValue: "Item 042",
          filteredItems,
        },
        expectedCombobox,
      ),
    ).toEqual(["filtered count was 9", `filtered values were ${filteredItems.join(",")}`]);
  });

  it("requires reset state and component identity to survive between flows", () => {
    const valid = {
      instanceId: "stable-root",
      fixtureInstanceId: "stable-root",
      selectedValue: "option-1",
      inputValue: "",
      submittedValue: "",
      expanded: "false",
    };
    expect(validateFormReset(valid, expectedSelect)).toEqual([]);
    expect(validateFormReset({ ...valid, fixtureInstanceId: "new-root" }, expectedSelect)).toEqual([
      "component instance changed",
    ]);
  });

  it("requires navigation to reach a new intended active option", () => {
    const first = { value: "option-1" };
    expect(validateNavigationChange(first, { value: "option-2" }, "option-2")).toEqual([]);
    expect(validateNavigationChange(first, first, "option-2")).toEqual([
      "navigation kept the previous active option",
      "navigation reached option-1 instead of option-2",
    ]);
    expect(validateNavigationChange(first, { value: "option-3" }, "option-4")).toEqual([
      "navigation reached option-3 instead of option-4",
    ]);
  });
});
