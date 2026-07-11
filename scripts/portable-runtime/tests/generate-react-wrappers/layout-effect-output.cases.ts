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

    expect(tree["internal/use-isomorphic-layout-effect.ts"]).toContain("React.useLayoutEffect");
    expect(runtimeControllerSetupFiles).toHaveLength(0);
    expect(tree["select/SelectRoot.tsx"]).toContain(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
    );
    expect(tree["select/SelectRoot.tsx"]).toContain("useIsomorphicLayoutEffect(() => {");
    expect(tree["select/SelectRoot.tsx"]).toContain("React.useEffect(() => {");
    expect(tree["select/SelectRoot.tsx"]).toContain("setSelectedLabel(");
    expect(tree["combobox/ComboboxRoot.tsx"]).toContain("useIsomorphicLayoutEffect(() => {");
  });
}
