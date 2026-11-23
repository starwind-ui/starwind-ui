import assert from "node:assert/strict";

import type { DirectionCase, DirectionExpectation } from "../../../../inventory.js";

export const cases: DirectionCase[] = [
  {
    id: "consumer-legacy-color",
    row: "legacy:color-picker",
    acceptance: ["SPEC-AC-14"],
    fixtures: {
      astro: {
        source: `---
import { ColorPicker } from "@direction/legacy-astro/color-picker";
import "@direction/sheet";
---
<html><head><title>Legacy color picker</title></head><body><ColorPicker /></body></html>`,
        exports: [],
        assertions: ["legacy-import", "legacy-only-utility-compiled"],
      },
    },
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "consumer-legacy-color",
    layer: "legacy",
    async run(page, _target, ctx) {
      const swatch = page.locator("[data-part=sat-rect]");
      await ctx.check("legacy-import", () => swatch.waitFor({ state: "attached" }));
      await ctx.check("legacy-only-utility-compiled", async () => {
        const background = await swatch.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        );
        ctx.observe("legacySwatchBackground", background);
        assert.notEqual(
          background,
          "rgba(0, 0, 0, 0)",
          "Legacy bg-red-500 utility was not compiled",
        );
      });
    },
  },
];
