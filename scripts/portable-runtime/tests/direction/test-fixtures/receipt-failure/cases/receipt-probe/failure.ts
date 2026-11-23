import assert from "node:assert/strict";

import type { DirectionCase, DirectionExpectation } from "../../../../inventory.js";

export const cases: DirectionCase[] = [
  {
    id: "receipt-failure",
    row: "button",
    acceptance: ["SPEC-AC-14"],
    fixtures: {
      astro: {
        source: `---
import { Button } from "@direction/styled-astro/button";
import "@direction/sheet";
---
<html><head><title>Receipt failure probe</title></head><body><Button data-receipt-button>Measured button</Button></body></html>`,
        exports: ["Button"],
        assertions: ["visible", "deliberate-failure", "later-check"],
      },
    },
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "receipt-failure",
    layer: "harness",
    async run(page, _target, ctx) {
      const button = page.locator("[data-receipt-button]");
      await ctx.check("visible", () => button.waitFor({ state: "visible" }));
      await ctx.check("deliberate-failure", async () => {
        const width = await button.evaluate((element) => element.getBoundingClientRect().width);
        ctx.observe("buttonWidth", width);
        assert(width < 0, "Deliberate receipt failure");
      });
      await ctx.check("later-check", async () => {
        const label = await button.textContent();
        ctx.observe("buttonLabel", label);
        assert.equal(label, "Measured button");
      });
    },
  },
];
