import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { progressStyledContract } from "../../contracts/styled/components/progress.js";
import { generateStarwindVueWrappers } from "../../generate-vue-wrappers.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";

describe("generated Vue Styled Progress", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
  });

  it("projects reactive presentation through the Progress Primitive without owning Runtime", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-progress-"));
    roots.push(root);
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });

    const source = await readFile(path.join(root, "styled/progress/Progress.vue"), "utf8");
    const index = await readFile(path.join(root, "styled/progress/index.ts"), "utf8");
    const variants = await readFile(path.join(root, "styled/progress/variants.ts"), "utf8");

    expect(() => assertVueSfcCompiles(source, "Progress.vue")).not.toThrow();
    expect(source).toContain('import * as ProgressPrimitive from "@starwind-ui/vue/progress";');
    expect(source).toContain("const progressValue = computed(() =>");
    expect(source).toContain(
      "const isIndeterminate = computed(() => progressValue.value === null);",
    );
    expect(source).toContain("value == null || !Number.isFinite(Number(value))");
    expect(source).toContain(
      "Math.min(Math.max(Number(value), normalizedMin.value), normalizedMax.value)",
    );
    expect(source).toContain(
      "const normalizedMin = computed(() => Math.min(boundedMin.value, boundedMax.value));",
    );
    expect(source).toContain(
      "const normalizedMax = computed(() => Math.max(boundedMin.value, boundedMax.value));",
    );
    expect(source).toContain("normalizedMax.value === normalizedMin.value");
    expect(source).toContain("progressValue.value! >= normalizedMax.value");
    expect(source).toContain(':max="normalizedMax"');
    expect(source).toContain(':min="normalizedMin"');
    expect(source).toContain("100 - progressPercent.value");
    expect(source).toContain("defineExpose({ element });");
    expect(source).toContain(':ref="setElement"');
    expect(source).toContain(`v-bind="{ ...attrs, 'aria-label': ariaLabel }"`);
    expect(source).toContain('data-slot="progress"');
    expect(source).toContain('data-slot="progress-track"');
    expect(source).toContain('data-slot="progress-indicator"');
    expect(source).toContain(':style="indicatorStyle"');
    expect(source).not.toContain("createProgress");
    expect(source).not.toContain("watch(");
    expect(index).toContain(
      "const ProgressVariants = { progress, progressIndicator, progressTrack };",
    );
    expect(index).toContain("export { Progress, ProgressVariants };");
    expect(progressStyledContract.publicExports).toEqual(["Progress"]);
    expect(variants).toContain('base: "bg-muted h-2 w-full overflow-hidden rounded-full"');
    expect(variants).toContain("data-instant:transition-none");
    expect(variants).toContain("motion-reduce:transition-none");
    expect(variants).toContain('indeterminate: "absolute inset-y-0 start-0 w-3/4"');
    expect(variants).toContain('success: "bg-success"');
    expect(variants).toContain('error: "bg-error"');
  });

  it("is deterministic across fresh output roots", async () => {
    const firstRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-progress-first-"));
    const secondRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-progress-second-"));
    roots.push(firstRoot, secondRoot);

    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: firstRoot });
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: secondRoot });

    for (const file of ["Progress.vue", "index.ts", "variants.ts"]) {
      await expect(readFile(path.join(firstRoot, "styled/progress", file), "utf8")).resolves.toBe(
        await readFile(path.join(secondRoot, "styled/progress", file), "utf8"),
      );
    }
  });
});
