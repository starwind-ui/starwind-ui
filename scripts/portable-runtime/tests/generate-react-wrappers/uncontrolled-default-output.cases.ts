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

    expect(collapsibleRoot).toContain("const defaultOpenRef = React.useRef(defaultOpen);");
    expect(collapsibleRoot).toContain("defaultOpen: uncontrolledOpenRef.current");
    expect(collapsibleRoot).not.toContain("}, [defaultOpen, disabled]);");
    expect(collapsibleRoot).toContain("}, [disabled]);");

    expect(inputRoot).toContain("const defaultValueRef = React.useRef(defaultValue);");
    expect(inputRoot).toMatch(/createInput\(root, \{\s+defaultValue: defaultValueRef\.current,/);
    expect(inputRoot).toContain("const valueProps =");
    expect(inputRoot).toContain("value !== undefined");
    expect(inputRoot).toContain("? { value }");
    expect(inputRoot).toContain(": { defaultValue: defaultValueRef.current };");
    expect(inputRoot).not.toContain("}, [defaultValue");

    expect(inputOtpRoot).toContain("const defaultValueRef = React.useRef(defaultValue);");
    expect(inputOtpRoot).toContain("const uncontrolledValueRef = React.useRef(uncontrolledValue);");
    expect(inputOtpRoot).toMatch(
      /createInputOtp\(root, \{\s+defaultValue: uncontrolledValueRef\.current,/,
    );
    expect(inputOtpRoot).not.toContain("}, [defaultValue");
    expect(inputOtpRoot).toContain("}, [maxLength, patternText, readOnly]);");
    expect(inputOtpRoot).not.toContain(
      "}, [form, id, maxLength, name, pattern, readOnly, required]);",
    );

    expect(toggleRoot).toContain("const defaultPressedRef = React.useRef(defaultPressed);");
    expect(toggleRoot).toContain("defaultPressed: uncontrolledPressedRef.current");
    expect(toggleRoot).not.toContain("}, [defaultPressed, nativeButton, syncGroup, value]);");
    expect(toggleRoot).toContain("}, [nativeButton, syncGroup, value]);");
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

  it("recreates React runtime instances from current uncontrolled state instead of initial defaults", async () => {
    const tempRoot = getTempRoot();

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const tree = await readGeneratedTree(outputRoot);

    expect(tree["select/SelectRoot.tsx"]).toContain("const uncontrolledOpenRef = React.useRef");
    expect(tree["select/SelectRoot.tsx"]).toContain("const uncontrolledValueRef = React.useRef");
    expect(tree["select/SelectRoot.tsx"]).toContain("defaultOpen: uncontrolledOpenRef.current");
    expect(tree["select/SelectRoot.tsx"]).toContain("defaultValue: uncontrolledValueRef.current");

    expect(tree["sidebar/SidebarProvider.tsx"]).toContain(
      "const uncontrolledOpenRef = React.useRef",
    );
    expect(tree["sidebar/SidebarProvider.tsx"]).toContain(
      "const uncontrolledMobileOpenRef = React.useRef",
    );
    expect(tree["sidebar/SidebarProvider.tsx"]).toContain(
      "defaultOpen: uncontrolledOpenRef.current",
    );
    expect(tree["sidebar/SidebarProvider.tsx"]).toContain(
      "defaultMobileOpen: uncontrolledMobileOpenRef.current",
    );

    expect(tree["radio-group/RadioGroupRoot.tsx"]).toContain(
      "const uncontrolledValueRef = React.useRef",
    );
    expect(tree["radio-group/RadioGroupRoot.tsx"]).toContain(
      "defaultValue: uncontrolledValueRef.current",
    );
    expect(tree["switch/SwitchRoot.tsx"]).toContain(
      "defaultChecked: uncontrolledCheckedRef.current",
    );
    expect(tree["toggle/ToggleRoot.tsx"]).toContain(
      "defaultPressed: uncontrolledPressedRef.current",
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

    expect(tree["select/SelectRoot.tsx"]).toContain(
      "const selectedValue = value !== undefined ? value : (uncontrolledValue ?? null);",
    );
    expect(tree["select/SelectRoot.tsx"]).toContain('const renderedValue = selectedValue ?? "";');
    expect(tree["combobox/ComboboxRoot.tsx"]).toContain(
      "const selectedValue = value !== undefined ? value : (uncontrolledValue ?? null);",
    );
    expect(tree["combobox/ComboboxRoot.tsx"]).toContain('const renderedValue = selectedValue ?? "";');
  });
}
