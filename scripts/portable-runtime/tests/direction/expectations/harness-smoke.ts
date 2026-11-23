import assert from "node:assert/strict";

import type { DirectionExpectation } from "../inventory.js";

export const expectations: DirectionExpectation[] = [
  {
    id: "harness-smoke",
    layer: "harness",
    async run(page, target, ctx) {
      const button = page.locator("[data-direction-button]");
      await ctx.check("button-visible", () => button.waitFor({ state: "visible" }));
      await ctx.check("compiled-style", async () => {
        const display = await button.evaluate((element) => getComputedStyle(element).display);
        ctx.observe("buttonDisplay", display);
        assert.equal(display, "inline-flex", "Candidate Tailwind style did not compile");
      });
      await ctx.check("click-result", async () => {
        await button.click();
        const result = page.locator("[data-direction-result]");
        await result.getByText(`Activated ${target[0].toUpperCase()}${target.slice(1)}`).waitFor();
        ctx.observe("resultText", await result.textContent());
      });
    },
  },
];
