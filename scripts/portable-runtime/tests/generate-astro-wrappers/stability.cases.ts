import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateAstroPrimitiveWrappers,
  generateAstroWrappers,
  it,
  path,
  readGeneratedFile,
  readGeneratedTree,
} from "./shared.js";

export function defineAstroStabilityTests(getTempRoot: GetTempRoot): void {
  it("produces stable output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      astroOutputDir: "generated/starwind-runtime",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.astroOutputDir);

    await generateAstroWrappers(options);
    const firstRun = await readGeneratedTree(outputRoot);

    await generateAstroWrappers(options);
    const secondRun = await readGeneratedTree(outputRoot);

    expect(secondRun).toEqual(firstRun);
  });

  it("produces stable Button primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateAstroPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "button/ButtonRoot.astro");
    const firstIndex = await readGeneratedFile(outputRoot, "button/index.ts");

    await generateAstroPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "button/ButtonRoot.astro");
    const secondIndex = await readGeneratedFile(outputRoot, "button/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Progress primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateAstroPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "progress/ProgressRoot.astro");
    const firstValue = await readGeneratedFile(outputRoot, "progress/ProgressValue.astro");
    const firstIndex = await readGeneratedFile(outputRoot, "progress/index.ts");

    await generateAstroPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "progress/ProgressRoot.astro");
    const secondValue = await readGeneratedFile(outputRoot, "progress/ProgressValue.astro");
    const secondIndex = await readGeneratedFile(outputRoot, "progress/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondValue).toBe(firstValue);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Fieldset primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateAstroPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "fieldset/FieldsetRoot.astro");
    const firstLegend = await readGeneratedFile(outputRoot, "fieldset/FieldsetLegend.astro");
    const firstIndex = await readGeneratedFile(outputRoot, "fieldset/index.ts");

    await generateAstroPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "fieldset/FieldsetRoot.astro");
    const secondLegend = await readGeneratedFile(outputRoot, "fieldset/FieldsetLegend.astro");
    const secondIndex = await readGeneratedFile(outputRoot, "fieldset/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondLegend).toBe(firstLegend);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Input primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateAstroPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "input/InputRoot.astro");
    const firstIndex = await readGeneratedFile(outputRoot, "input/index.ts");

    await generateAstroPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "input/InputRoot.astro");
    const secondIndex = await readGeneratedFile(outputRoot, "input/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Toggle primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateAstroPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "toggle/ToggleRoot.astro");
    const firstIndex = await readGeneratedFile(outputRoot, "toggle/index.ts");

    await generateAstroPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "toggle/ToggleRoot.astro");
    const secondIndex = await readGeneratedFile(outputRoot, "toggle/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Switch primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateAstroPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "switch/SwitchRoot.astro");
    const firstThumb = await readGeneratedFile(outputRoot, "switch/SwitchThumb.astro");
    const firstIndex = await readGeneratedFile(outputRoot, "switch/index.ts");

    await generateAstroPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "switch/SwitchRoot.astro");
    const secondThumb = await readGeneratedFile(outputRoot, "switch/SwitchThumb.astro");
    const secondIndex = await readGeneratedFile(outputRoot, "switch/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondThumb).toBe(firstThumb);
    expect(secondIndex).toBe(firstIndex);
  });
}
