import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { generateStarwindReactWrappers } from "../../generate-react-wrappers.js";
import { FORWARD_REF_SCOPE_FIXTURE } from "../styled-contracts/vue-styled-forward-ref-scope.test.js";

describe("React Styled forward-ref applicability", () => {
  it("ignores a Vue-scoped fact and preserves scoped and unscoped React behavior", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-react-forward-ref-scope-"));
    const outputDir = "generated/styled";

    try {
      await generateStarwindReactWrappers({
        contracts: [FORWARD_REF_SCOPE_FIXTURE],
        outputDir,
        primitiveOutputDir: "generated/primitives",
        repoRoot: root,
      });

      const outputRoot = path.join(root, outputDir, FORWARD_REF_SCOPE_FIXTURE.component);
      const vueOnly = await readFile(path.join(outputRoot, "VueOnlyTarget.tsx"), "utf8");
      const reactOnly = await readFile(path.join(outputRoot, "ReactOnlyTarget.tsx"), "utf8");
      const unscoped = await readFile(path.join(outputRoot, "UnscopedTarget.tsx"), "utf8");

      expect(vueOnly).toContain('import type * as React from "react";');
      expect(vueOnly).toContain("function VueOnlyTarget(props: VueOnlyTargetProps)");
      expect(vueOnly).toContain("ref={ref}");
      expect(vueOnly).not.toContain("forwardRef");

      expect(reactOnly).toContain("React.forwardRef<HTMLDivElement, ReactOnlyTargetProps>");
      expect(reactOnly).toContain("ref={forwardedRef}");
      expect(unscoped).toContain("React.forwardRef<HTMLDivElement, UnscopedTargetProps>");
      expect(unscoped).toContain("ref={forwardedRef}");
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
