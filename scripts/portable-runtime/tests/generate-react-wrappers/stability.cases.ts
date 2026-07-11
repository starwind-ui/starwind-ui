import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateReactPrimitiveWrappers,
  generateReactWrappers,
  it,
  path,
  readGeneratedFile,
  readGeneratedTree,
} from "./shared.js";

export function defineReactStabilityTests(getTempRoot: GetTempRoot): void {
  it("produces stable React output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      reactOutputDir: "generated/starwind-runtime",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.reactOutputDir);

    await generateReactWrappers(options);
    const firstRun = await readGeneratedTree(outputRoot);

    await generateReactWrappers(options);
    const secondRun = await readGeneratedTree(outputRoot);

    expect(secondRun).toEqual(firstRun);
  });

  it("produces stable Button primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateReactPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "button/ButtonRoot.tsx");
    const firstIndex = await readGeneratedFile(outputRoot, "button/index.ts");

    await generateReactPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "button/ButtonRoot.tsx");
    const secondIndex = await readGeneratedFile(outputRoot, "button/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Progress primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateReactPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "progress/ProgressRoot.tsx");
    const firstValue = await readGeneratedFile(outputRoot, "progress/ProgressValue.tsx");
    const firstIndex = await readGeneratedFile(outputRoot, "progress/index.ts");

    await generateReactPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "progress/ProgressRoot.tsx");
    const secondValue = await readGeneratedFile(outputRoot, "progress/ProgressValue.tsx");
    const secondIndex = await readGeneratedFile(outputRoot, "progress/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondValue).toBe(firstValue);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Fieldset primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateReactPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "fieldset/FieldsetRoot.tsx");
    const firstLegend = await readGeneratedFile(outputRoot, "fieldset/FieldsetLegend.tsx");
    const firstIndex = await readGeneratedFile(outputRoot, "fieldset/index.ts");

    await generateReactPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "fieldset/FieldsetRoot.tsx");
    const secondLegend = await readGeneratedFile(outputRoot, "fieldset/FieldsetLegend.tsx");
    const secondIndex = await readGeneratedFile(outputRoot, "fieldset/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondLegend).toBe(firstLegend);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Input primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateReactPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "input/InputRoot.tsx");
    const firstIndex = await readGeneratedFile(outputRoot, "input/index.ts");

    await generateReactPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "input/InputRoot.tsx");
    const secondIndex = await readGeneratedFile(outputRoot, "input/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Toggle primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateReactPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "toggle/ToggleRoot.tsx");
    const firstIndex = await readGeneratedFile(outputRoot, "toggle/index.ts");

    await generateReactPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "toggle/ToggleRoot.tsx");
    const secondIndex = await readGeneratedFile(outputRoot, "toggle/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondIndex).toBe(firstIndex);
  });

  it("produces stable Switch primitive output when run more than once", async () => {
    const tempRoot = getTempRoot();
    const options = {
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    };
    const outputRoot = path.join(tempRoot, options.outputDir);

    await generateReactPrimitiveWrappers(options);
    const firstRoot = await readGeneratedFile(outputRoot, "switch/SwitchRoot.tsx");
    const firstThumb = await readGeneratedFile(outputRoot, "switch/SwitchThumb.tsx");
    const firstIndex = await readGeneratedFile(outputRoot, "switch/index.ts");

    await generateReactPrimitiveWrappers(options);
    const secondRoot = await readGeneratedFile(outputRoot, "switch/SwitchRoot.tsx");
    const secondThumb = await readGeneratedFile(outputRoot, "switch/SwitchThumb.tsx");
    const secondIndex = await readGeneratedFile(outputRoot, "switch/index.ts");

    expect(secondRoot).toBe(firstRoot);
    expect(secondThumb).toBe(firstThumb);
    expect(secondIndex).toBe(firstIndex);
  });
}
