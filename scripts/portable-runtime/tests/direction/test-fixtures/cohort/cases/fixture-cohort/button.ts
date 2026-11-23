import type { DirectionCase, DirectionExpectation } from "../../../../inventory.js";

export const cases: DirectionCase[] = [
  {
    id: "cohort-button",
    row: "button",
    acceptance: ["SPEC-AC-14"],
    fixtures: {
      astro: {
        source: `---
import { Button } from "@direction/styled-astro/button";
import "@direction/sheet";
---
<html><head><title>Cohort button</title></head><body>
  <Button data-cohort-button>Activate</Button><output data-cohort-result>Idle</output>
  <script>document.querySelector("[data-cohort-button]")?.addEventListener("click", () => { document.querySelector("[data-cohort-result]").textContent = "Activated"; });</script>
</body></html>`,
        exports: ["Button"],
        assertions: ["visible", "click-result", "compiled-style"],
      },
    },
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "cohort-button",
    layer: "styled",
    async run(page, _target, ctx) {
      const button = page.locator("[data-cohort-button]");
      await ctx.check("visible", () => button.waitFor({ state: "visible" }));
      await ctx.check("compiled-style", async () => {
        const display = await button.evaluate((element) => getComputedStyle(element).display);
        ctx.observe("buttonDisplay", display);
        if (display !== "inline-flex") throw new Error(`Unexpected button display: ${display}`);
      });
      await ctx.check("click-result", async () => {
        await button.click();
        await page.locator("[data-cohort-result]").getByText("Activated").waitFor();
      });
    },
  },
];
