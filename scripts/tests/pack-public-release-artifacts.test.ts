import path from "node:path";

import { describe, expect, it } from "vitest";

import { createPackPlan } from "../pack-public-release-artifacts.mjs";

describe("public release artifact packing", () => {
  it("keeps the stable pack plan and selects Vue only for the beta plan", () => {
    const outputDirectory = path.resolve(".release-packs-test");
    expect(createPackPlan({ outputDirectory }).packages.map(({ key }) => key)).toEqual([
      "runtime",
      "astro",
      "react",
      "cli",
    ]);
    const plan = createPackPlan({ outputDirectory, vueBeta: true });
    expect(plan.packages.map(({ key, name }) => ({ key, name }))).toEqual([
      { key: "runtime", name: "@starwind-ui/runtime" },
      { key: "astro", name: "@starwind-ui/astro" },
      { key: "react", name: "@starwind-ui/react" },
      { key: "vue", name: "@starwind-ui/vue" },
      { key: "cli", name: "starwind" },
    ]);
    expect(plan.packages.find(({ key }) => key === "vue")?.file).toBe(
      path.join(outputDirectory, "starwind-vue.tgz"),
    );
  });
});
