import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { generateVuePrimitiveWrappers } from "../../generate-vue-wrappers.js";

describe("Vue Theme facade generation", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates the exact Runtime-backed Theme facade", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-theme-"));
    temporaryRoots.push(repoRoot);

    await generateVuePrimitiveWrappers({ outputDir: "generated", repoRoot });

    const source = await readFile(path.join(repoRoot, "generated/theme/index.ts"), "utf8");
    expect(source).toContain(
      'export type { ThemeInitScriptOptions } from "@starwind-ui/runtime/theme";',
    );
    expect(source).toContain(
      'export { getThemeInitScript, initThemeController } from "@starwind-ui/runtime/theme";',
    );
    expect(source).not.toMatch(/useTheme|ThemeControllerInstance|createThemeController/);
  });
});
