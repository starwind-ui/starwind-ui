import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateStarwindAstroWrappers,
  it,
  path,
  readGeneratedFile,
  starwindStyledContracts,
} from "./shared.js";

export function defineAstroCompositionOutputTests(getTempRoot: GetTempRoot): void {
  it("uses styled adapter contracts as the source of truth for styled output", async () => {
    const tempRoot = getTempRoot();
    const buttonContract = structuredClone(
      starwindStyledContracts.find((contract) => contract.component === "button")!,
    );
    buttonContract.variants!.button.base = ["contract-driven-button-class"];

    await generateStarwindAstroWrappers({
      contracts: [buttonContract],
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    const buttonVariants = await readGeneratedFile(outputRoot, "button/variants.ts");
    const button = await readGeneratedFile(outputRoot, "button/Button.astro");

    expect(buttonVariants).toContain("contract-driven-button-class");
    expect(button).toContain("<a");
    expect(button).toContain("<ButtonPrimitive.Root");
  });

  it("supports composing other generated Starwind components in Astro styled output", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
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
      primitiveOutputDir: "generated/starwind-runtime/primitives/astro",
      repoRoot: tempRoot,
    });

    const synthetic = await readGeneratedFile(
      path.join(tempRoot, "generated/starwind-runtime"),
      "synthetic/SyntheticAction.astro",
    );

    expect(synthetic).toContain('import type { ComponentProps } from "astro/types";');
    expect(synthetic).toContain('import { Button } from "../button";');
    expect(synthetic).toContain('Omit<ComponentProps<typeof Button>, "size">');
    expect(synthetic).toContain("VariantProps<typeof syntheticAction>");
    expect(synthetic).toContain("<Button");
    expect(synthetic).toContain("syntheticAction({ class: className })");
    expect(synthetic).toContain('data-slot="synthetic-action"');
  });

  it("uses sibling imports for same-package composed Astro styled components", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
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
      primitiveOutputDir: "generated/starwind-runtime/primitives/astro",
      repoRoot: tempRoot,
    });

    const syntheticRoot = await readGeneratedFile(
      path.join(tempRoot, "generated/starwind-runtime"),
      "synthetic/SyntheticRoot.astro",
    );

    expect(syntheticRoot).toContain('import RenamedSyntheticItem from "./SyntheticItem.astro";');
    expect(syntheticRoot).not.toContain('from "./"');
    expect(syntheticRoot).toContain("ComponentProps<typeof RenamedSyntheticItem>");
    expect(syntheticRoot).toContain("<RenamedSyntheticItem");
    expect(syntheticRoot).toContain('data-slot="synthetic-root-item"');
  });
}
