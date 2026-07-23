import type { GetTempRoot } from "./shared.js";
import { expect, generateAstroPrimitiveWrappers, it, path, readGeneratedTree } from "./shared.js";

export function defineAstroRuntimeSubpathOutputTests(getTempRoot: GetTempRoot): void {
  it("imports runtime controllers from component subpaths", async () => {
    const tempRoot = getTempRoot();

    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/astro");
    const tree = await readGeneratedTree(outputRoot);
    const nonIndexRootImports = Object.entries(tree)
      .filter(([relativePath]) => !relativePath.endsWith("index.ts"))
      .filter(([, source]) => source.includes('from "@starwind-ui/runtime"'))
      .map(([relativePath]) => relativePath);

    expect(nonIndexRootImports).toEqual([]);
    expect(tree["button/ButtonRoot.astro"]).toContain(
      'import { createButton } from "@starwind-ui/runtime/button"',
    );
    expect(tree["select/SelectRoot.astro"]).toContain(
      'import { createSelect } from "@starwind-ui/runtime/select"',
    );
    expect(tree["context-menu/ContextMenuRoot.astro"]).toContain(
      'import { createContextMenu } from "@starwind-ui/runtime/context-menu"',
    );
    expect(tree["toast/ToastViewport.astro"]).toContain(
      'import { createToastManager } from "@starwind-ui/runtime/toast"',
    );
  });

  it("re-exports app-facing runtime helpers and types from framework package subpaths", async () => {
    const tempRoot = getTempRoot();

    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/astro");
    const tree = await readGeneratedTree(outputRoot);

    expect(tree["carousel/index.ts"]).toContain(
      'export { createCarousel } from "@starwind-ui/runtime/carousel";',
    );
    expect(tree["form/index.ts"]).toContain('from "@starwind-ui/runtime/form";');
    expect(tree["form/index.ts"]).toContain('from "@starwind-ui/runtime";');
    const formFacadeIdentifiers = [
      "createForm",
      "createFormSchemaValidator",
      "validateFormSchema",
      "FormExternalErrorOptions",
      "FormExternalErrors",
      "FormInstance",
      "FormOptions",
      "FormResetValidationOptions",
      "FormSchemaResult",
      "FormValidateOptions",
      "FormValidationCause",
      "FormValidationOutcome",
      "FormValidationTiming",
      "FormValues",
    ];
    for (const identifier of formFacadeIdentifiers) {
      expect(countIdentifierOccurrences(tree["form/index.ts"], identifier)).toBe(1);
    }
    expect(tree["index.ts"]).toContain('export * from "./form";');
    expect(tree["toast/index.ts"]).toContain('export { toast } from "@starwind-ui/runtime/toast";');
    expect(tree["toast/index.ts"]).toContain("ToastApi, ToastOptions, ToastPromiseOptions");
    expect(tree["theme/index.ts"]).toContain(
      'export { getThemeInitScript, initThemeController } from "@starwind-ui/runtime/theme";',
    );
  });
}

function countIdentifierOccurrences(source: string, identifier: string): number {
  return source.match(new RegExp(`\\b${identifier}\\b`, "g"))?.length ?? 0;
}
