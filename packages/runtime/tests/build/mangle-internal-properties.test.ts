import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  internalPropertyPattern,
  planRuntimeInternalProperties,
} from "../../build/mangle-internal-properties";

describe("internal property rename plan", () => {
  const plan = planRuntimeInternalProperties(
    fileURLToPath(new URL("../../tsconfig.json", import.meta.url)),
  );
  const pattern = internalPropertyPattern(plan);

  it.each([
    ["a public option on a mapped type", "yStart"],
    ["a public method", "setOpen"],
    ["a browser API that source declares", "sRGBHex"],
    ["a global expando property", "__starwindRuntime__"],
    ["a Floating UI input", "floating"],
    ["a DOM property", "hidden"],
    ["a controller method that another Runtime copy calls", "refreshPortalSurface"],
    ["an event detail field", "reason"],
  ])("keeps %s", (_label, name) => {
    expect(pattern.test(name)).toBe(false);
  });

  it("renames a property that only Runtime source can see", () => {
    expect(pattern.test("positioner")).toBe(true);
    expect(pattern.test("forceApply")).toBe(true);
  });
});
