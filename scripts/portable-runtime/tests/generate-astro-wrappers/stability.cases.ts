import { rm } from "node:fs/promises";

import { GENERATED_BY } from "../../generate-astro-wrappers.js";
import { createAstroHeader } from "../../renderers/framework-adapters/astro/headers.js";
import { getPrimitiveGeneratorEntries } from "../../renderers/primitive-generator-registry.js";
import { appendRuntimeTypeFacades } from "../../renderers/primitive-index.js";
import { createTsHeader } from "../../renderers/shared.js";
import type { GetTempRoot } from "./shared.js";
import { expect, generateAstroWrappers, it, path, readGeneratedTree } from "./shared.js";

const COHORT = ["button", "checkbox", "select"] as const;

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

    const unrelatedBefore = withoutCohort(firstRun.primitives);
    await Promise.all(
      COHORT.map((component) =>
        rm(path.join(primitiveOutputRoot, component), {
          force: true,
          recursive: true,
        }),
      ),
    );
    await regenerateCohort(primitiveOutputRoot);
    const regenerated = await readGeneratedTree(primitiveOutputRoot);

    expect(regenerated).toEqual(firstRun.primitives);
    expect(withoutCohort(regenerated)).toEqual(unrelatedBefore);
  });
}

async function regenerateCohort(outputRoot: string): Promise<void> {
  const entries = getPrimitiveGeneratorEntries().filter((entry) =>
    COHORT.includes(entry.component as (typeof COHORT)[number]),
  );
  expect(entries.map((entry) => entry.component).sort()).toEqual([...COHORT].sort());

  await Promise.all(
    entries.map((entry) =>
      entry.generateTarget({
        componentHeader: createAstroHeader(GENERATED_BY),
        moduleHeader: createTsHeader(GENERATED_BY),
        outputRoot,
        target: "astro",
      }),
    ),
  );
  await appendRuntimeTypeFacades(outputRoot, COHORT);
}

function withoutCohort(tree: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).filter(
      ([relativePath]) => !COHORT.some((component) => relativePath.startsWith(`${component}/`)),
    ),
  );
}
