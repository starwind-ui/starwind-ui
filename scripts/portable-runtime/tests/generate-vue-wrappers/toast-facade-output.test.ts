import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { toastStyledContract } from "../../contracts/styled/components/toast.js";
import { generateStarwindVueWrappers } from "../../generate-vue-wrappers.js";

describe("Vue Styled Toast facade output", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-toast-facade-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  it("exposes the styled Toast facade through package and local Primitive sources", async () => {
    const packageOutputDir = "generated/package-backed";
    const localOutputDir = "generated/local-backed";
    const primitiveOutputDir = "generated/primitives/vue";

    await generateStarwindVueWrappers({
      contracts: [toastStyledContract],
      outputDir: packageOutputDir,
      primitiveImportBase: "@starwind-ui/vue",
      repoRoot: tempRoot,
    });
    await generateStarwindVueWrappers({
      contracts: [toastStyledContract],
      outputDir: localOutputDir,
      primitiveImportBase: "",
      primitiveOutputDir,
      repoRoot: tempRoot,
    });

    const packageIndex = await readFile(
      path.join(tempRoot, packageOutputDir, "toast/index.ts"),
      "utf8",
    );
    const localIndex = await readFile(
      path.join(tempRoot, localOutputDir, "toast/index.ts"),
      "utf8",
    );
    const primitiveIndex = await readFile(
      path.join(process.cwd(), "packages/vue/src/toast/index.ts"),
      "utf8",
    );

    assertVueToastFacade(packageIndex, "@starwind-ui/vue/toast");
    assertVueToastFacade(localIndex, "../../primitives/vue/toast");
    expect(primitiveIndex).toContain(
      'export type { ToastApi, ToastOptions, ToastPromiseOptions } from "@starwind-ui/runtime";',
    );
    expect(primitiveIndex).toContain('export { toast } from "@starwind-ui/runtime/toast";');
  });
});

function assertVueToastFacade(source: string, primitiveSource: string): void {
  expect(source).toContain(`export { toast } from "${primitiveSource}";`);
  expect(source).toContain(
    `export type { ToastApi, ToastOptions, ToastPromiseOptions } from "${primitiveSource}";`,
  );
  expect(source).toContain(
    "const ToastParts = { Viewport: Toaster, Template: ToastTemplate, Item: ToastItem, Content: ToastContent, Title: ToastTitle, Description: ToastDescription, Action: ToastAction, Close: ToastClose };",
  );
  expect(source).not.toMatch(/const ToastParts = \{[^}]*\b(?:Manager|toast)\b/);
}
