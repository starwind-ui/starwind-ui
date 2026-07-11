import type { GetTempRoot } from "./shared.js";
import {
  expect,
  formatGeneratedOutput,
  generateReactPrimitiveWrappers,
  generateStarwindReactWrappers,
  it,
  path,
  readFormattedGeneratedTree,
  readGeneratedFile,
  readGeneratedTree,
  starwindStyledContracts,
} from "./shared.js";

export function defineReactCompositionOutputTests(getTempRoot: GetTempRoot): void {
  it("uses styled adapter contracts as the source of truth for React styled output", async () => {
    const tempRoot = getTempRoot();
    const buttonContract = structuredClone(
      starwindStyledContracts.find((contract) => contract.component === "button")!,
    );
    buttonContract.variants!.button.base = ["react-contract-driven-button-class"];

    await generateStarwindReactWrappers({
      contracts: [buttonContract],
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    const buttonVariants = await readGeneratedFile(outputRoot, "button/variants.ts");
    const button = await readGeneratedFile(outputRoot, "button/Button.tsx");

    expect(buttonVariants).toContain("react-contract-driven-button-class");
    expect(button).toContain("<a");
    expect(button).toContain("<ButtonPrimitive.Root");
  });

  it("supports composing other generated Starwind components in React styled output", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      contracts: [
        {
          component: "synthetic",
          defaultExport: { SyntheticAction: "SyntheticAction" },
          defaultExportMode: "component",
          publicExports: ["SyntheticAction"],
          variantCollectionName: "SyntheticVariants",
          variants: {
            syntheticAction: { base: "synthetic-action" },
          },
          components: [
            {
              exportName: "SyntheticAction",
              props: {
                extends: [
                  {
                    type: "componentProps",
                    component: "button",
                    exportName: "Button",
                    keys: ["size"],
                  },
                  { type: "variantProps", variant: "syntheticAction" },
                ],
              },
              destructure: {
                props: [{ name: "class", alias: "className" }],
                rest: "rest",
              },
              render: [
                {
                  type: "component",
                  component: "button",
                  exportName: "Button",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "syntheticAction",
                        args: { class: "className" },
                      },
                    },
                    { name: "spread", value: { type: "variable", name: "rest" } },
                    { name: "data-slot", value: { type: "literal", value: "synthetic-action" } },
                  ],
                  children: [{ type: "slot" }],
                },
              ],
            },
          ],
        },
      ],
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    const synthetic = await readGeneratedFile(
      path.join(tempRoot, "generated/starwind-runtime"),
      "synthetic/SyntheticAction.tsx",
    );

    expect(synthetic).toContain('import { Button } from "../button";');
    expect(synthetic).toContain('Omit<React.ComponentProps<typeof Button>, "size">');
    expect(synthetic).toContain("VariantProps<typeof syntheticAction>");
    expect(synthetic).toContain("<Button");
    expect(synthetic).toContain("syntheticAction({ class: className })");
    expect(synthetic).toContain('data-slot="synthetic-action"');
  });

  it("uses sibling imports for same-package composed React styled components", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      contracts: [
        {
          component: "synthetic",
          defaultExport: { Root: "SyntheticRoot", Item: "SyntheticItem" },
          publicExports: ["SyntheticRoot", "SyntheticItem"],
          components: [
            {
              exportName: "SyntheticRoot",
              props: {
                extends: [
                  {
                    type: "componentProps",
                    component: "synthetic",
                    exportName: "SyntheticItem",
                    localName: "RenamedSyntheticItem",
                  },
                ],
              },
              destructure: { props: [], rest: "rest" },
              render: [
                {
                  type: "component",
                  component: "synthetic",
                  exportName: "SyntheticItem",
                  localName: "RenamedSyntheticItem",
                  attrs: [
                    { name: "spread", value: { type: "variable", name: "rest" } },
                    {
                      name: "data-slot",
                      value: { type: "literal", value: "synthetic-root-item" },
                    },
                  ],
                  children: [{ type: "slot" }],
                },
              ],
            },
            {
              exportName: "SyntheticItem",
              props: { extends: [{ type: "htmlAttributes", element: "span" }] },
              destructure: { props: [], rest: "rest" },
              render: [
                {
                  type: "element",
                  tag: "span",
                  attrs: [{ name: "spread", value: { type: "variable", name: "rest" } }],
                  children: [{ type: "slot" }],
                },
              ],
            },
          ],
        },
      ],
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    const syntheticRoot = await readGeneratedFile(
      path.join(tempRoot, "generated/starwind-runtime"),
      "synthetic/SyntheticRoot.tsx",
    );

    expect(syntheticRoot).toContain('import RenamedSyntheticItem from "./SyntheticItem";');
    expect(syntheticRoot).not.toContain('from "./"');
    expect(syntheticRoot).toContain("React.ComponentProps<typeof RenamedSyntheticItem>");
    expect(syntheticRoot).toContain("<RenamedSyntheticItem");
    expect(syntheticRoot).toContain('data-slot="synthetic-root-item"');
  });

  it("wraps long React prop aliases without requiring custom fields", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      contracts: [
        {
          component: "synthetic",
          defaultExport: { Synthetic: "Synthetic" },
          defaultExportMode: "component",
          publicExports: ["Synthetic"],
          variants: {
            synthetic: { base: "synthetic-base" },
          },
          components: [
            {
              exportName: "Synthetic",
              props: {
                extends: [
                  { type: "htmlAttributes", element: "button" },
                  { type: "omitHtmlAttributes", element: "a", keys: ["type"] },
                  { type: "variantProps", variant: "synthetic" },
                ],
              },
              destructure: {
                props: [{ name: "class", alias: "className" }],
                rest: "rest",
              },
              render: [
                {
                  type: "element",
                  tag: "div",
                  attrs: [
                    {
                      name: "class",
                      value: {
                        type: "classVariant",
                        variant: "synthetic",
                        args: { class: "className" },
                      },
                    },
                    { name: "spread", value: { type: "variable", name: "rest" } },
                  ],
                  children: [{ type: "slot" }],
                },
              ],
            },
          ],
        },
      ],
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    const synthetic = await readGeneratedFile(
      path.join(tempRoot, "generated/starwind-runtime"),
      "synthetic/Synthetic.tsx",
    );

    expect(synthetic).toContain('React.ComponentPropsWithoutRef<"button"> &');
    expect(synthetic).toContain('Omit<React.ComponentPropsWithoutRef<"a">, "type"> &');
    expect(synthetic).toContain("VariantProps<typeof synthetic>;");
  });

  it("keeps checked-in React primitive outputs in sync with the generator", async () => {
    const tempRoot = getTempRoot();
    const generatedOutputDir = "generated/primitives/react";
    const generatedOutputRoot = path.join(tempRoot, generatedOutputDir);
    const repoOutputRoot = path.resolve("packages/react/src");

    await generateReactPrimitiveWrappers({
      outputDir: generatedOutputDir,
      repoRoot: tempRoot,
    });
    await formatGeneratedOutput([generatedOutputRoot]);

    expect(await readFormattedGeneratedTree(repoOutputRoot)).toEqual(
      await readFormattedGeneratedTree(generatedOutputRoot),
    );
  }, 45_000);

  it("generates stable composed refs for React asChild primitive parts", async () => {
    const tempRoot = getTempRoot();
    const generatedOutputDir = "generated/primitives/react";
    const generatedOutputRoot = path.join(tempRoot, generatedOutputDir);

    await generateReactPrimitiveWrappers({
      outputDir: generatedOutputDir,
      repoRoot: tempRoot,
    });

    const helper = await readGeneratedFile(generatedOutputRoot, "internal/compose-refs.ts");
    const generatedTree = await readGeneratedTree(generatedOutputRoot);
    const navigationMenuTrigger = await readGeneratedFile(
      generatedOutputRoot,
      "navigation-menu/NavigationMenuTrigger.tsx",
    );
    const menuTrigger = await readGeneratedFile(generatedOutputRoot, "menu/MenuTrigger.tsx");
    const selectTrigger = await readGeneratedFile(generatedOutputRoot, "select/SelectTrigger.tsx");
    const childFirstTriggerSources = [navigationMenuTrigger, menuTrigger, selectTrigger];

    expect(helper).toContain("export function useComposedRefs");
    expect(helper).toContain("export function setRef");
    expect(helper).toContain("export function getAsChildElement");
    expect(helper).toContain("export function mergeAsChildProps");
    expect(helper).toContain('const { eventOrder = "child-first", protectedProps } = options;');
    expect(helper).toContain(
      "const mergedProps: AsChildProps = { ...parentProps, ...childProps };",
    );
    expect(helper).toContain("mergeAsChildClassName(parentProps.className, childProps.className)");
    expect(helper).toContain("function mergeAsChildStyle");
    expect(helper).toContain("mergeAsChildStyle(parentProps.style, childProps.style)");
    expect(helper).toContain("composeAsChildEventHandlers(");
    expect(helper).toContain("parentHandler,\n      childHandler,\n      eventOrder,");
    expect(helper).toContain("Object.assign(mergedProps, protectedProps)");
    expect(helper).toContain("event.defaultPrevented");
    expect(helper).toContain('eventOrder === "parent-first"');
    expect(helper).toContain("React.useCallback");
    expect(helper).toContain('if (typeof ref === "function")');
    expect(helper).toContain("const cleanup = ref(value);");
    expect(helper).toContain('typeof cleanup === "function" ? cleanup : () => ref(null)');
    expect(helper).toContain("cleanups.reverse().forEach((cleanup) => cleanup())");
    expect(helper).toContain("ref.current = value;");
    expect(helper).toContain("[outerRef, innerRef]");
    expect(navigationMenuTrigger).toContain(
      'import { getAsChildElement, getElementRef, mergeAsChildProps, useComposedRefs } from "../internal/compose-refs";',
    );
    expect(navigationMenuTrigger).toContain("const composedRef = useComposedRefs(");
    expect(navigationMenuTrigger).toContain("ref: composedRef");
    expect(menuTrigger).toContain("const composedRef = useComposedRefs(");
    expect(selectTrigger).toContain("const composedRef = useComposedRefs(");
    childFirstTriggerSources.forEach((source) => {
      expect(source).toContain("const childProps = child.props;");
      expect(source).toContain("mergeAsChildProps({ ...triggerProps, className }, childProps, {");
      expect(source).toContain("protectedProps: protectedTriggerProps");
      expect(source).toContain("ref: composedRef");
      expect(source).not.toContain('eventOrder: "parent-first"');
    });
    expect(navigationMenuTrigger).not.toContain("function mergeRefs");
    expect(navigationMenuTrigger).not.toContain("mergeRefs(forwardedRef");
    expect(menuTrigger).not.toContain("function mergeRefs");
    expect(selectTrigger).not.toContain("function mergeRefs");
    expect(
      Object.entries(generatedTree)
        .filter(([, contents]) => contents.includes("function mergeRefs"))
        .map(([filePath]) => filePath),
    ).toEqual([]);
  });
}
