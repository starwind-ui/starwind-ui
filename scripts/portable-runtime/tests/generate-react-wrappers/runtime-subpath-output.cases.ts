import type { GetTempRoot } from "./shared.js";
import { expect, generateReactPrimitiveWrappers, it, path, readGeneratedTree } from "./shared.js";

export function defineReactRuntimeSubpathOutputTests(getTempRoot: GetTempRoot): void {
  it("imports runtime controllers from component subpaths", async () => {
    const tempRoot = getTempRoot();

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const tree = await readGeneratedTree(outputRoot);
    const nonIndexRootImports = Object.entries(tree)
      .filter(([relativePath]) => !relativePath.endsWith("index.ts"))
      .filter(([, source]) => source.includes('from "@starwind-ui/runtime"'))
      .map(([relativePath]) => relativePath);

    expect(nonIndexRootImports).toEqual([]);
    expect(tree["button/ButtonRoot.tsx"]).toContain(
      'import { createButton } from "@starwind-ui/runtime/button";',
    );
    expect(tree["select/SelectRoot.tsx"]).toContain('from "@starwind-ui/runtime/select";');
    expect(tree["context-menu/ContextMenuRoot.tsx"]).toContain(
      'from "@starwind-ui/runtime/context-menu";',
    );
    expect(tree["toast/ToastViewport.tsx"]).toContain(
      'import { createToastManager } from "@starwind-ui/runtime/toast";',
    );
  });

  it("re-exports app-facing runtime helpers and types from framework package subpaths", async () => {
    const tempRoot = getTempRoot();

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
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
