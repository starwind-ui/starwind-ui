import { describe, expect, it } from "vitest";

import {
  closeAccordionItem,
  normalizeAccordionValue,
  openAccordionItem,
  toggleAccordionItem,
} from "../../../src/components/accordion/accordion-state";

describe("accordion state", () => {
  it("normalizes single values", () => {
    expect(normalizeAccordionValue("single", ["one", "two"])).toBe("one");
    expect(normalizeAccordionValue("single", undefined)).toBeNull();
  });

  it("normalizes multiple values", () => {
    expect(normalizeAccordionValue("multiple", "one")).toEqual(["one"]);
    expect(normalizeAccordionValue("multiple", ["one", "one", "two"])).toEqual(["one", "two"]);
    expect(normalizeAccordionValue("multiple", undefined)).toEqual([]);
  });

  it("opens one item in single mode", () => {
    expect(openAccordionItem("one", "two", { type: "single", collapsible: false })).toBe("two");
  });

  it("adds items in multiple mode", () => {
    expect(openAccordionItem(["one"], "two", { type: "multiple", collapsible: false })).toEqual([
      "one",
      "two",
    ]);
  });

  it("respects non-collapsible single mode", () => {
    expect(closeAccordionItem("one", "one", { type: "single", collapsible: false })).toBe("one");
  });

  it("allows collapsible single mode to close", () => {
    expect(closeAccordionItem("one", "one", { type: "single", collapsible: true })).toBeNull();
  });

  it("toggles items in multiple mode", () => {
    expect(toggleAccordionItem(["one"], "two", { type: "multiple", collapsible: false })).toEqual([
      "one",
      "two",
    ]);
    expect(
      toggleAccordionItem(["one", "two"], "one", { type: "multiple", collapsible: false }),
    ).toEqual(["two"]);
  });
});
