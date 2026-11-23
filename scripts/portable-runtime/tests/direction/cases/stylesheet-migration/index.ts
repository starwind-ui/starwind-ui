import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import { ROOT } from "../../inventory.js";

const markup = `<div data-variant-scope="ordinary-ltr" dir="ltr"><span data-variant-probe class="ltr:rotate-0 rtl:rotate-180">Ordinary LTR</span></div>
<div data-variant-scope="page-rtl" dir="rtl"><span data-variant-probe class="ltr:rotate-0 rtl:rotate-180">Page RTL</span>
  <div data-variant-scope="nested-ltr" dir="ltr"><span data-variant-probe class="ltr:rotate-0 rtl:rotate-180">Nested LTR</span>
    <div data-variant-scope="deeper-rtl" dir="rtl"><span data-variant-probe class="ltr:rotate-0 rtl:rotate-180">Deeper RTL</span></div>
  </div>
</div>`;

const scopedAssertions = ["ordinary-ltr", "page-rtl", "nested-ltr", "deeper-rtl"];
const retainedAssertions = [
  "retained-ltr",
  "retained-rtl",
  "built-in-nested-mismatch",
  "custom-css",
];
const demoRequire = createRequire(path.join(ROOT, "apps/demo/package.json"));
const { compile } = demoRequire("tailwindcss") as {
  compile: (source: string) => Promise<{ build: (candidates: string[]) => string }>;
};
const retainedSource = `@tailwind utilities;
@source inline("ltr:rotate-0 rtl:rotate-180");
:root { --retained-sheet: preserved; }
`;
const retainedCss = (await compile(retainedSource)).build(["ltr:rotate-0", "rtl:rotate-180"]);

export const cases: DirectionCase[] = [
  {
    id: "stylesheet-migration-scoped",
    row: "theme",
    acceptance: ["SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-15"],
    fixtures: {
      astro: {
        source: `---\nimport "@direction/sheet";\n---\n<html><head><title>Scoped direction variants Astro</title></head><body>${markup}</body></html>`,
        exports: [],
        assertions: scopedAssertions,
      },
      react: {
        source: `import { createRoot } from "react-dom/client";
import "@direction/sheet";
function App() { return <main dangerouslySetInnerHTML={{ __html: ${JSON.stringify(markup)} }} />; }
createRoot(document.getElementById("app")!).render(<App />);`,
        exports: [],
        assertions: scopedAssertions,
      },
      vue: {
        source: `<script setup lang="ts">import "@direction/sheet";</script><template><main>${markup}</main></template>`,
        exports: [],
        assertions: scopedAssertions,
      },
      svelte: {
        source: `<script lang="ts">import "@direction/sheet";</script><main>${markup}</main>`,
        exports: [],
        assertions: scopedAssertions,
      },
    },
  },
  {
    id: "stylesheet-migration-retained",
    row: "theme",
    acceptance: ["SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-15"],
    fixtures: {
      astro: {
        source: `---\n---\n<html><head><title>Retained direction stylesheet</title><style is:global>${retainedCss}</style></head><body>${markup}</body></html>`,
        exports: [],
        assertions: retainedAssertions,
      },
    },
  },
];

async function angles(page: Parameters<DirectionExpectation["run"]>[0]) {
  const result: Record<string, string> = {};
  for (const scope of ["ordinary-ltr", "page-rtl", "nested-ltr", "deeper-rtl"])
    result[scope] = await page
      .locator(`[data-variant-scope="${scope}"] > [data-variant-probe]`)
      .evaluate((element) => getComputedStyle(element).rotate);
  return result;
}

export const expectations: DirectionExpectation[] = [
  {
    id: "stylesheet-migration-scoped",
    layer: "raw-html",
    async run(page, target, ctx) {
      const result = await angles(page);
      ctx.observe(`${target}ScopedAngles`, result);
      for (const [name, scope, expected] of [
        ["ordinary-ltr", "ordinary-ltr", "0deg"],
        ["page-rtl", "page-rtl", "180deg"],
        ["nested-ltr", "nested-ltr", "0deg"],
        // The variants support one level of mixed direction. Content in RTL inside LTR inside
        // RTL gets `ltr:`. This pins that documented limit.
        ["deeper-rtl", "deeper-rtl", "0deg"],
      ])
        await ctx.check(name, () => assert.equal(result[scope], expected));
    },
  },
  {
    id: "stylesheet-migration-retained",
    layer: "raw-html",
    async run(page, _target, ctx) {
      const result = await angles(page);
      ctx.observe("retainedAngles", result);
      await ctx.check("retained-ltr", () => assert.equal(result["ordinary-ltr"], "0deg"));
      await ctx.check("retained-rtl", () => assert.equal(result["page-rtl"], "180deg"));
      await ctx.check("built-in-nested-mismatch", () =>
        assert.equal(result["nested-ltr"], "180deg"),
      );
      await ctx.check("custom-css", async () => {
        const value = await page
          .locator("html")
          .evaluate((element) =>
            getComputedStyle(element).getPropertyValue("--retained-sheet").trim(),
          );
        ctx.observe("retainedCustomValue", value);
        assert.equal(value, "preserved");
      });
    },
  },
];
