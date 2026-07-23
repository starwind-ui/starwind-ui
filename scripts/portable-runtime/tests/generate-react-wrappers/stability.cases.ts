import type { GetTempRoot } from "./shared.js";
import { expect, generateReactWrappers, it, path, readGeneratedTree } from "./shared.js";

export function defineReactStabilityTests(getTempRoot: GetTempRoot): void {
  it("produces stable styled and primitive React output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      primitiveOutputDir: "generated/primitives/react",
      reactOutputDir: "generated/starwind-runtime",
      repoRoot: tempRoot,
    };
    const styledOutputRoot = path.join(tempRoot, options.reactOutputDir);
    const primitiveOutputRoot = path.join(tempRoot, options.primitiveOutputDir);

    await generateReactWrappers(options);
    const firstRun = {
      primitives: await readGeneratedTree(primitiveOutputRoot),
      styled: await readGeneratedTree(styledOutputRoot),
    };

    await generateReactWrappers(options);
    const secondRun = {
      primitives: await readGeneratedTree(primitiveOutputRoot),
      styled: await readGeneratedTree(styledOutputRoot),
    };

    expect(secondRun).toEqual(firstRun);
  });
}
