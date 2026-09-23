import { compactCode } from "../source-comparison.js";
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

    expect(compactCode(buttonVariants)).toContain(
      compactCode("react-contract-driven-button-class"),
    );
    expect(compactCode(button)).toContain(compactCode("<a"));
    expect(compactCode(button)).toContain(compactCode("<ButtonPrimitive.Root"));
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

    expect(compactCode(synthetic)).toContain(compactCode('import { Button } from "../button";'));
    expect(compactCode(synthetic)).toContain(
      compactCode('Omit<React.ComponentProps<typeof Button>, "size">'),
    );
    expect(compactCode(synthetic)).toContain(compactCode("VariantProps<typeof syntheticAction>"));
    expect(compactCode(synthetic)).toContain(compactCode("<Button"));
    expect(compactCode(synthetic)).toContain(compactCode("syntheticAction({ class: className })"));
    expect(compactCode(synthetic)).toContain(compactCode('data-slot="synthetic-action"'));
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

    expect(compactCode(syntheticRoot)).toContain(
      compactCode('import RenamedSyntheticItem from "./SyntheticItem";'),
    );
    expect(compactCode(syntheticRoot)).not.toContain(compactCode('from "./"'));
    expect(compactCode(syntheticRoot)).toContain(
      compactCode("React.ComponentProps<typeof RenamedSyntheticItem>"),
    );
    expect(compactCode(syntheticRoot)).toContain(compactCode("<RenamedSyntheticItem"));
    expect(compactCode(syntheticRoot)).toContain(compactCode('data-slot="synthetic-root-item"'));
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

    expect(compactCode(synthetic)).toContain(
      compactCode('React.ComponentPropsWithoutRef<"button"> &'),
    );
    expect(compactCode(synthetic)).toContain(
      compactCode('Omit<React.ComponentPropsWithoutRef<"a">, "type"> &'),
    );
    expect(compactCode(synthetic)).toContain(compactCode("VariantProps<typeof synthetic>;"));
  });

  it("keeps checked-in React primitive outputs in sync outside deferred Form facades", async () => {
    const tempRoot = getTempRoot();
    const generatedOutputDir = "generated/primitives/react";
    const generatedOutputRoot = path.join(tempRoot, generatedOutputDir);
    const repoOutputRoot = path.resolve("packages/react/src");

    await generateReactPrimitiveWrappers({
      outputDir: generatedOutputDir,
      repoRoot: tempRoot,
    });
    await formatGeneratedOutput([generatedOutputRoot]);

    const checkedInTree = await readFormattedGeneratedTree(repoOutputRoot);
    const generatedTree = await readFormattedGeneratedTree(generatedOutputRoot);
    const deferredFacadePaths = ["form/index.ts", "index.ts"];

    for (const facadePath of deferredFacadePaths) {
      delete checkedInTree[facadePath];
      delete generatedTree[facadePath];
    }

    expect(checkedInTree).toEqual(generatedTree);
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

    expect(compactCode(helper)).toContain(compactCode("export function useComposedRefs"));
    expect(compactCode(helper)).toContain(compactCode("export function setRef"));
    expect(compactCode(helper)).toContain(compactCode("export function getAsChildElement"));
    expect(compactCode(helper)).toContain(compactCode("export function mergeAsChildProps"));
    expect(compactCode(helper)).toContain(
      compactCode('const { eventOrder = "child-first", protectedProps } = options;'),
    );
    expect(compactCode(helper)).toContain(
      compactCode("const mergedProps: AsChildProps = { ...parentProps, ...childProps };"),
    );
    expect(compactCode(helper)).toContain(
      compactCode("mergeAsChildClassName(parentProps.className, childProps.className)"),
    );
    expect(compactCode(helper)).toContain(compactCode("function mergeAsChildStyle"));
    expect(compactCode(helper)).toContain(
      compactCode("mergeAsChildStyle(parentProps.style, childProps.style)"),
    );
    expect(compactCode(helper)).toContain(compactCode("composeAsChildEventHandlers("));
    expect(compactCode(helper)).toContain(
      compactCode("parentHandler,\n      childHandler,\n      eventOrder,"),
    );
    expect(compactCode(helper)).toContain(
      compactCode("Object.assign(mergedProps, protectedProps)"),
    );
    expect(compactCode(helper)).toContain(compactCode("event.defaultPrevented"));
    expect(compactCode(helper)).toContain(compactCode('eventOrder === "parent-first"'));
    expect(compactCode(helper)).toContain(compactCode("React.useCallback"));
    expect(compactCode(helper)).toContain(compactCode('if (typeof ref === "function")'));
    expect(compactCode(helper)).toContain(compactCode("const cleanup = ref(value);"));
    expect(compactCode(helper)).toContain(
      compactCode('typeof cleanup === "function" ? cleanup : () => ref(null)'),
    );
    expect(compactCode(helper)).toContain(
      compactCode("cleanups.reverse().forEach((cleanup) => cleanup())"),
    );
    expect(compactCode(helper)).toContain(compactCode("ref.current = value;"));
    expect(compactCode(helper)).toContain(compactCode("[outerRef, innerRef]"));
    expect(compactCode(navigationMenuTrigger)).toContain(
      compactCode(
        'import { getAsChildElement, getElementRef, mergeAsChildProps, useComposedRefs } from "../internal/compose-refs";',
      ),
    );
    expect(compactCode(navigationMenuTrigger)).toContain(
      compactCode("const composedRef = useComposedRefs("),
    );
    expect(compactCode(navigationMenuTrigger)).toContain(compactCode("ref: composedRef"));
    expect(compactCode(menuTrigger)).toContain(compactCode("const composedRef = useComposedRefs("));
    expect(compactCode(selectTrigger)).toContain(
      compactCode("const composedRef = useComposedRefs("),
    );
    childFirstTriggerSources.forEach((source) => {
      expect(compactCode(source)).toContain(compactCode("const childProps = child.props;"));
      expect(compactCode(source)).toContain(
        compactCode("mergeAsChildProps({ ...triggerProps, className }, childProps, {"),
      );
      expect(compactCode(source)).toContain(compactCode("protectedProps: protectedTriggerProps"));
      expect(compactCode(source)).toContain(compactCode("ref: composedRef"));
      expect(compactCode(source)).not.toContain(compactCode('eventOrder: "parent-first"'));
    });
    expect(compactCode(navigationMenuTrigger)).not.toContain(compactCode("function mergeRefs"));
    expect(compactCode(navigationMenuTrigger)).not.toContain(compactCode("mergeRefs(forwardedRef"));
    expect(compactCode(menuTrigger)).not.toContain(compactCode("function mergeRefs"));
    expect(compactCode(selectTrigger)).not.toContain(compactCode("function mergeRefs"));
    expect(
      Object.entries(generatedTree)
        .filter(([, contents]) => contents.includes("function mergeRefs"))
        .map(([filePath]) => filePath),
    ).toEqual([]);
  });
}
