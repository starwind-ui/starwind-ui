import type { GetTempRoot } from "./shared.js";
import { expect, generateAstroWrappers, it, path, readGeneratedTree } from "./shared.js";

export function defineAstroStabilityTests(getTempRoot: GetTempRoot): void {
  it("produces stable styled and primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      astroOutputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    };
    const styledOutputRoot = path.join(tempRoot, options.astroOutputDir);
    const primitiveOutputRoot = path.join(tempRoot, options.primitiveOutputDir);

    await generateAstroWrappers(options);
    const firstRun = {
      primitives: await readGeneratedTree(primitiveOutputRoot),
      styled: await readGeneratedTree(styledOutputRoot),
    };

    await generateAstroWrappers(options);
    const secondRun = {
      primitives: await readGeneratedTree(primitiveOutputRoot),
      styled: await readGeneratedTree(styledOutputRoot),
    };

    expect(secondRun).toEqual(firstRun);
  });
}
