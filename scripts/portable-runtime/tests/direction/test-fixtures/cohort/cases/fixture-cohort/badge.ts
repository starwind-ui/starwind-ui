import assert from "node:assert/strict";

import type { DirectionCase, DirectionExpectation } from "../../../../inventory.js";

export const cases: DirectionCase[] = [
  {
    id: "cohort-badge",
    row: "badge",
    acceptance: ["SPEC-AC-14"],
    fixtures: {
      astro: {
        source: `---
import { Badge } from "@direction/styled-astro/badge";
import "@direction/sheet";
---
<html><head><title>Cohort badge</title></head><body><Badge data-cohort-badge>Ready</Badge></body></html>`,
        exports: ["Badge"],
        assertions: ["visible", "compiled-style"],
      },
    },
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "cohort-badge",
    layer: "styled",
    async run(page, _target, ctx) {
      const badge = page.locator("[data-cohort-badge]");
      await ctx.check("visible", () => badge.waitFor({ state: "visible" }));
      await ctx.check("compiled-style", async () => {
        const display = await badge.evaluate((element) => getComputedStyle(element).display);
        ctx.observe("badgeDisplay", display);
        assert.equal(display, "inline-flex");
      });
    },
  },
];
