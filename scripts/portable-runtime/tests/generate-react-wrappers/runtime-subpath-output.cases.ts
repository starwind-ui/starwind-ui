import { compactCode } from "../source-comparison.js";
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
    expect(compactCode(tree["button/ButtonRoot.tsx"])).toContain(
      compactCode("@starwind-ui/runtime/button"),
    );
    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode('from "@starwind-ui/runtime/select";'),
    );
    expect(compactCode(tree["context-menu/ContextMenuRoot.tsx"])).toContain(
      compactCode('from "@starwind-ui/runtime/context-menu";'),
    );
    expect(compactCode(tree["toast/ToastViewport.tsx"])).toContain(
      compactCode('import { createToastManager } from "@starwind-ui/runtime/toast";'),
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

    expect(compactCode(tree["carousel/index.ts"])).toContain(
      compactCode('export { createCarousel } from "@starwind-ui/runtime/carousel";'),
    );
    expect(compactCode(tree["form/index.ts"])).toContain(
      compactCode('from "@starwind-ui/runtime/form";'),
    );
    expect(compactCode(tree["form/index.ts"])).toContain(
      compactCode('from "@starwind-ui/runtime";'),
    );
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
    expect(compactCode(tree["index.ts"])).toContain(compactCode('export * from "./form";'));
    expect(compactCode(tree["toast/index.ts"])).toContain(
      compactCode('export { toast } from "@starwind-ui/runtime/toast";'),
    );
    expect(compactCode(tree["toast/index.ts"])).toContain(
      compactCode("ToastApi, ToastOptions, ToastPromiseOptions"),
    );
    expect(compactCode(tree["theme/index.ts"])).toContain(
      compactCode(
        'export { getThemeInitScript, initThemeController } from "@starwind-ui/runtime/theme";',
      ),
    );
  });
}

function countIdentifierOccurrences(source: string, identifier: string): number {
  return source.match(new RegExp(`\\b${identifier}\\b`, "g"))?.length ?? 0;
}
