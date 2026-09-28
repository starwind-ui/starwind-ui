import { compactCode } from "../source-comparison.js";
import type { GetTempRoot } from "./shared.js";
import { expect, generateReactPrimitiveWrappers, it, path, readGeneratedTree } from "./shared.js";

export function defineReactUncontrolledDefaultOutputTests(getTempRoot: GetTempRoot): void {
  it("seeds uncontrolled defaults once for representative React runtime wrappers", async () => {
    const tempRoot = getTempRoot();

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const tree = await readGeneratedTree(outputRoot);
    const collapsibleRoot = tree["collapsible/CollapsibleRoot.tsx"];
    const inputRoot = tree["input/InputRoot.tsx"];
    const inputOtpRoot = tree["input-otp/InputOtpRoot.tsx"];
    const toggleRoot = tree["toggle/ToggleRoot.tsx"];

    expect(compactCode(collapsibleRoot)).toContain(
      compactCode("const initialDefaultOpen = React.useRef(defaultOpen ?? false).current"),
    );
    expect(compactCode(inputRoot)).toContain(
      compactCode("const defaultValueRef = React.useRef(defaultValue)"),
    );
    expect(compactCode(inputRoot)).toContain(compactCode("defaultValue: defaultValueRef.current"));
    expect(compactCode(inputOtpRoot)).toContain(
      compactCode('const seed = React.useRef(defaultValue ?? "")'),
    );
    expect(compactCode(inputOtpRoot)).toContain(
      compactCode("const [current, setCurrent] = React.useState(seed.current)"),
    );
    expect(compactCode(toggleRoot)).toContain(
      compactCode(
        "const initialDefault = React.useRef(inputs.current.defaultPressed ?? false).current",
      ),
    );
  });

  it("keeps uncontrolled default props out of React runtime construction dependencies", async () => {
    const tempRoot = getTempRoot();

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const tree = await readGeneratedTree(outputRoot);
    const effectDependencyPattern = /\}, \[[^\]]*?\]\);/g;
    const failures = Object.entries(tree)
      .filter(
        ([relativePath, source]) =>
          relativePath.endsWith(".tsx") &&
          source.includes(".destroy()") &&
          source
            .match(effectDependencyPattern)
            ?.some((dependencies) => /\bdefault[A-Z]\w*\b/.test(dependencies)),
      )
      .map(([relativePath, source]) => {
        return {
          relativePath,
          dependencies: source
            .match(effectDependencyPattern)
            ?.filter((dependencies) => /\bdefault[A-Z]\w*\b/.test(dependencies)),
        };
      });

    expect(failures).toEqual([]);
  });

  it("renders React data-default attributes from seeded default refs", async () => {
    const tempRoot = getTempRoot();

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const tree = await readGeneratedTree(outputRoot);
    const dataDefaultAttributePattern = /data-default-[^=]+=\{[^}]*\}/g;
    const failures = Object.entries(tree)
      .filter(([relativePath]) => relativePath.endsWith(".tsx"))
      .map(([relativePath, source]) => ({
        relativePath,
        attributes: (source.match(dataDefaultAttributePattern) ?? []).filter((attribute) => {
          const identifiers = attribute.match(/\bdefault[A-Z]\w*\b/g) ?? [];
          return identifiers.some(
            (identifier) => !identifier.endsWith("Ref") && !identifier.endsWith("Attribute"),
          );
        }),
      }))
      .filter((failure) => failure.attributes.length > 0);

    expect(failures).toEqual([]);
  });

  it("preserves React uncontrolled state separately from boolean reset defaults", async () => {
    const tempRoot = getTempRoot();

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const tree = await readGeneratedTree(outputRoot);

    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode("const uncontrolledOpenRef = React.useRef"),
    );
    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode("const uncontrolledValueRef = React.useRef"),
    );
    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode("defaultOpen: disabled ? false : (uncontrolledOpenRef.current)"),
    );
    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode("defaultValue: defaultValueRef.current"),
    );
    const selectRoot = tree["select/SelectRoot.tsx"]!;
    expect(compactCode(selectRoot)).toContain(
      compactCode("const formElement = input?.form ?? null;"),
    );
    expect(compactCode(selectRoot)).toContain(compactCode("ref={inputRef}"));
    expect(selectRoot).toMatch(/queueMicrotask\(\(\) => \{[\s\S]*window\.setTimeout/);
    expect(compactCode(selectRoot)).toContain(compactCode("event.defaultPrevented || superseded"));
    expect(compactCode(selectRoot)).toContain(compactCode("revision !== valueRevisionRef.current"));
    expect(compactCode(selectRoot)).toContain(
      compactCode('reset.form?.removeEventListener("reset", reset.listener)'),
    );
    expect(compactCode(selectRoot)).toContain(compactCode("window.clearTimeout(reset.timer)"));
    expect(compactCode(selectRoot)).toContain(
      compactCode("findSelectedOptionText(childrenRef.current, acceptedValue)"),
    );
    expect(compactCode(selectRoot)).not.toContain(compactCode("MutationObserver"));

    expect(compactCode(tree["sidebar/SidebarProvider.tsx"])).toContain(
      compactCode("const seedOpen = React.useRef(defaultOpen).current"),
    );
    expect(compactCode(tree["sidebar/SidebarProvider.tsx"])).toContain(
      compactCode("const seedMobileOpen = React.useRef(defaultMobileOpen).current"),
    );
    expect(compactCode(tree["radio-group/RadioGroupRoot.tsx"])).toContain(
      compactCode("defaultValue: resetSeed"),
    );
    expect(compactCode(tree["switch/SwitchRoot.tsx"])).toContain(
      compactCode("defaultChecked: resetSeed"),
    );
    expect(compactCode(tree["toggle/ToggleRoot.tsx"])).toContain(
      compactCode("defaultPressed: desired"),
    );
  });

  it("renders nullable controlled Select and Combobox values as empty hidden values", async () => {
    const tempRoot = getTempRoot();

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const tree = await readGeneratedTree(outputRoot);

    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode(
        "const selectedValue = value !== undefined ? value : (uncontrolledValue ?? null);",
      ),
    );
    expect(compactCode(tree["select/SelectRoot.tsx"])).toContain(
      compactCode('const renderedValue = selectedValue ?? "";'),
    );
    expect(compactCode(tree["combobox/ComboboxRoot.tsx"])).toContain(
      compactCode(
        "const selectedValue = value !== undefined ? value : (uncontrolledValue ?? null);",
      ),
    );
    expect(compactCode(tree["combobox/ComboboxRoot.tsx"])).toContain(
      compactCode('const renderedValue = selectedValue ?? "";'),
    );
  });
}
