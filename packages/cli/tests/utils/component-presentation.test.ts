import { describe, expect, it } from "vitest";

import {
  compareComponentPresentation,
  sortComponentPresentation,
  sortComponentPresentationByName,
} from "../../src/utils/component-presentation.js";

describe("component presentation", () => {
  it("sorts names case-insensitively without changing the input array", () => {
    const components = [
      { name: "zebra" },
      { name: "Alpha" },
      { name: "button" },
      { name: "Button" },
    ];

    expect(sortComponentPresentation(components)).toEqual([
      { name: "Alpha" },
      { name: "Button" },
      { name: "button" },
      { name: "zebra" },
    ]);
    expect(components.map((component) => component.name)).toEqual([
      "zebra",
      "Alpha",
      "button",
      "Button",
    ]);
  });

  it("uses identity as a deterministic tie-breaker for duplicate names", () => {
    const components = [
      { name: "button", framework: "react" },
      { name: "Button", framework: "react" },
      { name: "button", framework: "astro" },
    ];

    expect(sortComponentPresentation(components)).toEqual([
      { name: "Button", framework: "react" },
      { name: "button", framework: "astro" },
      { name: "button", framework: "react" },
    ]);
  });

  it("sorts values with non-name fields through the shared comparator", () => {
    const primitives = [
      { component: "zebra", framework: "astro" },
      { component: "Alpha", framework: "react" },
      { component: "alpha", framework: "astro" },
    ];

    expect(
      sortComponentPresentationByName(
        primitives,
        (primitive) => primitive.component,
        (primitive) => primitive.framework,
      ),
    ).toEqual([
      { component: "Alpha", framework: "react" },
      { component: "alpha", framework: "astro" },
      { component: "zebra", framework: "astro" },
    ]);
    expect(compareComponentPresentation({ name: "Alpha" }, { name: "zebra" })).toBeLessThan(0);
  });
});
