import { compactCode } from "../source-comparison.js";
import type { GetTempRoot } from "./shared.js";
import { expect, generateReactPrimitiveWrappers, it, path, readGeneratedTree } from "./shared.js";

export function defineReactLayoutEffectOutputTests(getTempRoot: GetTempRoot): void {
  it("uses an isomorphic layout effect for runtime primitive controller files", async () => {
    const tempRoot = getTempRoot();

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const tree = await readGeneratedTree(outputRoot);
    const runtimeControllerSetupFiles = Object.entries(tree).filter(
      ([relativePath, source]) =>
        relativePath.endsWith(".tsx") &&
        source.includes("React.useEffect(() => {\n    const root = rootRef.current") &&
        source.includes(".destroy()"),
    );

    expect(compactCode(tree["internal/use-isomorphic-layout-effect.ts"])).toContain(
      compactCode("React.useLayoutEffect"),
    );
    expect(runtimeControllerSetupFiles).toHaveLength(0);
    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode(
        'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
      ),
    );
    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode("useIsomorphicLayoutEffect(() => {"),
    );
    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode("React.useEffect(() => {"),
    );
    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(compactCode("setSelectedLabel("));
    expect(compactCode(tree["combobox/ComboboxRoot.tsx"])).toContain(
      compactCode("useIsomorphicLayoutEffect(() => {"),
    );
  });
}
