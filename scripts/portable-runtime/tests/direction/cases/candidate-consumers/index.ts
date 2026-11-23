import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import { ROOT } from "../../inventory.js";

const markup = `<section data-consumer="ordinary"><span data-probe class="ltr:rotate-0 rtl:rotate-180 ml-2 rtl:mr-6">LTR</span></section>
<section data-consumer="rtl" dir="rtl"><span data-probe class="ltr:rotate-0 rtl:rotate-180 ml-2 rtl:mr-6">RTL</span><span data-merge class="ml-2 ms-4 rtl:mr-6">Merge</span>
  <section data-consumer="nested" dir="ltr"><span data-probe class="ltr:rotate-0 rtl:rotate-180 ml-2 rtl:mr-6">Nested LTR</span></section>
</section>`;
const targets = ["astro", "react", "vue", "svelte"] as const;
const scopedAssertions = targets.flatMap((target) => [
  `${target}-ordinary`,
  `${target}-rtl`,
  `${target}-nested`,
  `${target}-physical-margin`,
  `${target}-physical-logical-merge`,
]);
const retainedAssertions = ["retained-ordinary", "retained-rtl", "old-nested-mismatch"];
const demoRequire = createRequire(path.join(ROOT, "apps/demo/package.json"));
const { compile } = demoRequire("tailwindcss") as {
  compile: (source: string) => Promise<{ build: (candidates: string[]) => string }>;
};
const retainedSource = `@tailwind utilities;
@source inline("ltr:rotate-0 rtl:rotate-180 ml-2 ms-4 rtl:mr-6");`;
const retainedCss = (await compile(retainedSource)).build([
  "ltr:rotate-0",
  "rtl:rotate-180",
  "ml-2",
  "ms-4",
  "rtl:mr-6",
]);

export const cases: DirectionCase[] = [
  {
    id: "candidate-consumers-fresh-scoped-style",
    row: "theme",
    acceptance: ["SPEC-AC-02", "SPEC-AC-14", "SPEC-AC-15"],
    physicalExceptions: ["Physical left/right margin utilities keep their physical CSS meaning."],
    fixtures: {
      astro: {
        source: `---\nimport "@direction/sheet";\n---\n<html><head><title>Installed candidate style Astro</title></head><body>${markup}</body></html>`,
        exports: [],
        assertions: scopedAssertions.filter((item) => item.startsWith("astro-")),
      },
      react: {
        source: `import { createRoot } from "react-dom/client"; import "@direction/sheet"; createRoot(document.getElementById("app")!).render(<main dangerouslySetInnerHTML={{__html:${JSON.stringify(markup)}}} />);`,
        exports: [],
        assertions: scopedAssertions.filter((item) => item.startsWith("react-")),
      },
      vue: {
        source: `<script setup lang="ts">import "@direction/sheet";</script><template><main>${markup}</main></template>`,
        exports: [],
        assertions: scopedAssertions.filter((item) => item.startsWith("vue-")),
      },
      svelte: {
        source: `<script lang="ts">import "@direction/sheet";</script><main>${markup}</main>`,
        exports: [],
        assertions: scopedAssertions.filter((item) => item.startsWith("svelte-")),
      },
    },
  },
  {
    id: "candidate-consumers-retained-old-style",
    row: "theme",
    acceptance: ["SPEC-AC-02", "SPEC-AC-15"],
    fixtures: {
      astro: {
        source: `---\n---\n<html><head><title>Retained candidate stylesheet</title><style is:global>${retainedCss}</style></head><body>${markup}</body></html>`,
        exports: [],
        assertions: retainedAssertions,
      },
    },
  },
];

async function observed(page: Parameters<DirectionExpectation["run"]>[0]) {
  const entries: Record<string, { rotate: string; marginLeft: string; marginRight: string }> = {};
  for (const name of ["ordinary", "rtl", "nested"])
    entries[name] = await page
      .locator(`[data-consumer="${name}"] > [data-probe]`)
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          rotate: style.rotate,
          marginLeft: style.marginLeft,
          marginRight: style.marginRight,
        };
      });
  return entries;
}

export const expectations: DirectionExpectation[] = [
  {
    id: "candidate-consumers-fresh-scoped-style",
    layer: "theme",
    async run(page, target, ctx) {
      const result = await observed(page);
      ctx.observe(`${target}ConsumerStyle`, result);
      await ctx.check(`${target}-ordinary`, () => assert.equal(result.ordinary?.rotate, "0deg"));
      await ctx.check(`${target}-rtl`, () => assert.equal(result.rtl?.rotate, "180deg"));
      await ctx.check(`${target}-nested`, () => assert.equal(result.nested?.rotate, "0deg"));
      await ctx.check(`${target}-physical-margin`, () => {
        assert.equal(result.ordinary?.marginLeft, "8px");
        assert.equal(result.rtl?.marginRight, "24px");
        assert.equal(result.nested?.marginRight, "0px");
      });
      const merge = await page.locator("[data-merge]").evaluate((element) => ({
        left: getComputedStyle(element).marginLeft,
        right: getComputedStyle(element).marginRight,
      }));
      ctx.observe(`${target}PhysicalLogicalMerge`, merge);
      await ctx.check(`${target}-physical-logical-merge`, () => {
        assert.equal(merge.left, "8px");
        assert.equal(merge.right, "24px");
      });
    },
  },
  {
    id: "candidate-consumers-retained-old-style",
    layer: "theme",
    async run(page, _target, ctx) {
      const result = await observed(page);
      ctx.observe("retainedConsumerStyle", result);
      await ctx.check("retained-ordinary", () => assert.equal(result.ordinary?.rotate, "0deg"));
      await ctx.check("retained-rtl", () => assert.equal(result.rtl?.rotate, "180deg"));
      await ctx.check("old-nested-mismatch", () => assert.equal(result.nested?.rotate, "180deg"));
    },
  },
];
