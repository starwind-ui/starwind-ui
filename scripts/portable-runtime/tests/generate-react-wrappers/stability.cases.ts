import { rm } from "node:fs/promises";

import { GENERATED_BY } from "../../generate-react-wrappers.js";
import { getPrimitiveGeneratorEntries } from "../../renderers/primitive-generator-registry.js";
import { appendRuntimeTypeFacades } from "../../renderers/primitive-index.js";
import { createTsHeader } from "../../renderers/shared.js";
import type { GetTempRoot } from "./shared.js";
import { expect, generateReactWrappers, it, path, readGeneratedTree } from "./shared.js";

const COHORT = ["button", "checkbox", "select"] as const;

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
        moduleHeader: createTsHeader(GENERATED_BY),
        outputRoot,
        target: "react",
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
