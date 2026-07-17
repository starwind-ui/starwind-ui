import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { generateStarwindAstroWrappers } from "../generate-astro-wrappers.js";
import { generateStarwindReactWrappers } from "../generate-react-wrappers.js";

function getVariantExport(source: string, exportName: string): string {
  const start = source.indexOf(`export const ${exportName} = tv({`);
  expect(start).toBeGreaterThanOrEqual(0);

  const nextExport = source.indexOf("\n\nexport const ", start + 1);
  return nextExport === -1 ? source.slice(start) : source.slice(start, nextExport);
}

async function readGeneratedFile(outputRoot: string, relativePath: string): Promise<string> {
  return readFile(path.join(outputRoot, relativePath), "utf8");
}

describe("placement-aware floating styled animations", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-placement-animations-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  it("generates Dropdown and Context Menu motion from resolved placement state", async () => {
    await generateStarwindAstroWrappers({
      outputDir: "generated/astro",
      primitiveOutputDir: "generated/astro/primitives/astro",
      repoRoot: tempRoot,
    });
    await generateStarwindReactWrappers({
      outputDir: "generated/react",
      primitiveOutputDir: "generated/react/primitives/react",
      repoRoot: tempRoot,
    });

    const astroOutputRoot = path.join(tempRoot, "generated/astro");
    const reactOutputRoot = path.join(tempRoot, "generated/react");
    const cases = [
      {
        contentClassCall: "dropdownContent({ class: className })",
        subContentClassCall: "dropdownContent({ class: subContentClassName })",
        contentSlot: 'data-slot="dropdown-content"',
        subContentSlot: 'data-slot="dropdown-sub-content"',
        variantExport: "dropdownContent",
        astroContentPath: "dropdown/DropdownContent.astro",
        astroSubContentPath: "dropdown/DropdownSubContent.astro",
        astroVariantsPath: "dropdown/variants.ts",
        reactContentPath: "dropdown/DropdownContent.tsx",
        reactSubContentPath: "dropdown/DropdownSubContent.tsx",
        reactVariantsPath: "dropdown/variants.ts",
      },
      {
        contentClassCall: "contextMenuContent({ class: className })",
        subContentClassCall: "contextMenuContent({ class: subContentClassName })",
        contentSlot: 'data-slot="context-menu-content"',
        subContentSlot: 'data-slot="context-menu-sub-content"',
        variantExport: "contextMenuContent",
        astroContentPath: "context-menu/ContextMenuContent.astro",
        astroSubContentPath: "context-menu/ContextMenuSubContent.astro",
        astroVariantsPath: "context-menu/variants.ts",
        reactContentPath: "context-menu/ContextMenuContent.tsx",
        reactSubContentPath: "context-menu/ContextMenuSubContent.tsx",
        reactVariantsPath: "context-menu/variants.ts",
      },
    ];

    for (const testCase of cases) {
      const astroContent = await readGeneratedFile(astroOutputRoot, testCase.astroContentPath);
      const astroSubContent = await readGeneratedFile(
        astroOutputRoot,
        testCase.astroSubContentPath,
      );
      const reactContent = await readGeneratedFile(reactOutputRoot, testCase.reactContentPath);
      const reactSubContent = await readGeneratedFile(
        reactOutputRoot,
        testCase.reactSubContentPath,
      );
      const astroVariants = await readGeneratedFile(astroOutputRoot, testCase.astroVariantsPath);
      const reactVariants = await readGeneratedFile(reactOutputRoot, testCase.reactVariantsPath);

      for (const content of [astroContent, reactContent]) {
        expect(content).toContain(testCase.contentClassCall);
        expect(content).not.toContain("side, align");
        expect(content).toContain("side={side}");
        expect(content).toContain("align={align}");
        expect(content).toContain("sideOffset={sideOffset}");
        expect(content).toContain("avoidCollisions={avoidCollisions}");
        expect(content).toContain(testCase.contentSlot);
      }

      for (const subContent of [astroSubContent, reactSubContent]) {
        expect(subContent).toContain(testCase.subContentClassCall);
        expect(subContent).not.toContain("side, align");
        expect(subContent).toContain("side={side}");
        expect(subContent).toContain("align={align}");
        expect(subContent).toContain("sideOffset={sideOffset}");
        expect(subContent).toContain("avoidCollisions={avoidCollisions}");
        expect(subContent).toContain(testCase.subContentSlot);
      }

      for (const variants of [astroVariants, reactVariants]) {
        const contentVariant = getVariantExport(variants, testCase.variantExport);
        expect(contentVariant).toContain(
          "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2",
        );
        expect(contentVariant).toContain(
          "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
        );
        expect(contentVariant).toContain(
          "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2",
        );
        expect(contentVariant).toContain(
          "data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
        );
        expect(contentVariant).toContain("origin-(--transform-origin)");
        expect(contentVariant).not.toContain("variants:");
        expect(contentVariant).not.toContain("compoundVariants:");
        expect(contentVariant).not.toContain("defaultVariants:");
      }
    }
  });

  it("generates Popover content motion from resolved placement state", async () => {
    await generateStarwindAstroWrappers({
      outputDir: "generated/astro",
      primitiveOutputDir: "generated/astro/primitives/astro",
      repoRoot: tempRoot,
    });
    await generateStarwindReactWrappers({
      outputDir: "generated/react",
      primitiveOutputDir: "generated/react/primitives/react",
      repoRoot: tempRoot,
    });

    const astroOutputRoot = path.join(tempRoot, "generated/astro");
    const reactOutputRoot = path.join(tempRoot, "generated/react");
    const astroContent = await readGeneratedFile(astroOutputRoot, "popover/PopoverContent.astro");
    const reactContent = await readGeneratedFile(reactOutputRoot, "popover/PopoverContent.tsx");
    const astroVariants = await readGeneratedFile(astroOutputRoot, "popover/variants.ts");
    const reactVariants = await readGeneratedFile(reactOutputRoot, "popover/variants.ts");

    expect(astroContent).toContain('exitMotion = "popover"');
    expect(astroContent).toContain("popoverContent({ exitMotion, class: className })");
    expect(astroContent).not.toContain("popoverContent({ side, align");
    expect(astroContent).toContain("side={side}");
    expect(astroContent).toContain("align={align}");
    expect(astroContent).toContain("sideOffset={sideOffset}");
    expect(astroContent).toContain("avoidCollisions={avoidCollisions}");

    expect(reactContent).toContain('exitMotion = "popover"');
    expect(reactContent).toContain("popoverContent({ exitMotion, class: className })");
    expect(reactContent).not.toContain("popoverContent({ side, align");
    expect(reactContent).toContain("side={side}");
    expect(reactContent).toContain("align={align}");
    expect(reactContent).toContain("sideOffset={sideOffset}");
    expect(reactContent).toContain("avoidCollisions={avoidCollisions}");

    for (const variants of [astroVariants, reactVariants]) {
      const popoverContentVariant = getVariantExport(variants, "popoverContent");
      expect(popoverContentVariant).toContain(
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
      );
      expect(popoverContentVariant).toContain(
        "data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2",
      );
      expect(popoverContentVariant).toContain(
        "data-[side=bottom]:slide-out-to-top-2 data-[side=top]:slide-out-to-bottom-2",
      );
      expect(popoverContentVariant).toContain(
        "data-[side=right]:slide-out-to-left-2 data-[side=left]:slide-out-to-right-2",
      );
      expect(popoverContentVariant).toContain("origin-(--transform-origin)");
      expect(popoverContentVariant).toContain("variants:");
      expect(popoverContentVariant).toContain("exitMotion:");
      expect(popoverContentVariant).not.toContain("compoundVariants:");
      expect(popoverContentVariant).toContain("defaultVariants:");
      expect(popoverContentVariant).toContain('exitMotion: "popover"');
      expect(popoverContentVariant).not.toContain("side: {");
      expect(popoverContentVariant).not.toContain("align: {");
    }
  });

  it("generates Select content motion from resolved placement state while preserving size styling", async () => {
    await generateStarwindAstroWrappers({
      outputDir: "generated/astro",
      primitiveOutputDir: "generated/astro/primitives/astro",
      repoRoot: tempRoot,
    });
    await generateStarwindReactWrappers({
      outputDir: "generated/react",
      primitiveOutputDir: "generated/react/primitives/react",
      repoRoot: tempRoot,
    });

    const astroOutputRoot = path.join(tempRoot, "generated/astro");
    const reactOutputRoot = path.join(tempRoot, "generated/react");
    const astroContent = await readGeneratedFile(astroOutputRoot, "select/SelectContent.astro");
    const reactContent = await readGeneratedFile(reactOutputRoot, "select/SelectContent.tsx");
    const astroVariants = await readGeneratedFile(astroOutputRoot, "select/variants.ts");
    const reactVariants = await readGeneratedFile(reactOutputRoot, "select/variants.ts");

    for (const content of [astroContent, reactContent]) {
      expect(content).toContain("selectContent({ size, class: className })");
      expect(content).not.toContain("selectContent({ side, align");
      expect(content).toContain('size = "md"');
      expect(content).toContain("align={align}");
      expect(content).toContain("alignOffset={alignOffset}");
      expect(content).toContain("alignItemWithTrigger={alignItemWithTrigger}");
      expect(content).toContain("avoidCollisions={avoidCollisions}");
      expect(content).toContain("side={side}");
      expect(content).toContain("sideOffset={sideOffset}");
      expect(content).toContain('data-align-trigger={alignItemWithTrigger ? "true" : "false"}');
    }

    for (const variants of [astroVariants, reactVariants]) {
      const selectContentVariant = getVariantExport(variants, "selectContent");
      expect(selectContentVariant).toContain(
        "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2",
      );
      expect(selectContentVariant).toContain(
        "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
      );
      expect(selectContentVariant).toContain(
        "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2",
      );
      expect(selectContentVariant).toContain(
        "data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
      );
      expect(selectContentVariant).toContain("origin-(--transform-origin)");
      expect(selectContentVariant).toContain("data-[align-trigger=true]:!animate-none");
      expect(selectContentVariant).toContain("variants:");
      expect(selectContentVariant).toContain("size:");
      expect(selectContentVariant).toContain("defaultVariants:");
      expect(selectContentVariant).toContain('size: "md"');
      expect(selectContentVariant).not.toContain("side: {");
      expect(selectContentVariant).not.toContain("align: {");
      expect(selectContentVariant).not.toContain("compoundVariants:");
    }
  });

  it("generates Combobox content motion from resolved placement state while preserving size styling", async () => {
    await generateStarwindAstroWrappers({
      outputDir: "generated/astro",
      primitiveOutputDir: "generated/astro/primitives/astro",
      repoRoot: tempRoot,
    });
    await generateStarwindReactWrappers({
      outputDir: "generated/react",
      primitiveOutputDir: "generated/react/primitives/react",
      repoRoot: tempRoot,
    });

    const astroOutputRoot = path.join(tempRoot, "generated/astro");
    const reactOutputRoot = path.join(tempRoot, "generated/react");
    const astroContent = await readGeneratedFile(
      astroOutputRoot,
      "combobox/ComboboxContent.astro",
    );
    const reactContent = await readGeneratedFile(
      reactOutputRoot,
      "combobox/ComboboxContent.tsx",
    );
    const astroVariants = await readGeneratedFile(astroOutputRoot, "combobox/variants.ts");
    const reactVariants = await readGeneratedFile(reactOutputRoot, "combobox/variants.ts");

    for (const content of [astroContent, reactContent]) {
      expect(content).toContain("comboboxContent({ size, class: className })");
      expect(content).not.toContain("comboboxContent({ side, align");
      expect(content).toContain('size = "md"');
      expect(content).toContain("align={align}");
      expect(content).toContain("alignOffset={alignOffset}");
      expect(content).toContain("avoidCollisions={avoidCollisions}");
      expect(content).toContain("side={side}");
      expect(content).toContain("sideOffset={sideOffset}");
    }

    for (const variants of [astroVariants, reactVariants]) {
      const comboboxContentVariant = getVariantExport(variants, "comboboxContent");
      expect(comboboxContentVariant).toContain(
        "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2",
      );
      expect(comboboxContentVariant).toContain(
        "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
      );
      expect(comboboxContentVariant).toContain(
        "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2",
      );
      expect(comboboxContentVariant).toContain(
        "data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
      );
      expect(comboboxContentVariant).toContain("origin-(--transform-origin)");
      expect(comboboxContentVariant).toContain("variants:");
      expect(comboboxContentVariant).toContain("size:");
      expect(comboboxContentVariant).toContain("defaultVariants:");
      expect(comboboxContentVariant).toContain('size: "md"');
      expect(comboboxContentVariant).not.toContain("side: {");
      expect(comboboxContentVariant).not.toContain("align: {");
      expect(comboboxContentVariant).not.toContain("compoundVariants:");
    }
  });

  it("generates Tooltip and Hover Card content zoom from resolved transform origin", async () => {
    await generateStarwindAstroWrappers({
      outputDir: "generated/astro",
      primitiveOutputDir: "generated/astro/primitives/astro",
      repoRoot: tempRoot,
    });
    await generateStarwindReactWrappers({
      outputDir: "generated/react",
      primitiveOutputDir: "generated/react/primitives/react",
      repoRoot: tempRoot,
    });

    const astroOutputRoot = path.join(tempRoot, "generated/astro");
    const reactOutputRoot = path.join(tempRoot, "generated/react");
    const astroTooltipContent = await readGeneratedFile(
      astroOutputRoot,
      "tooltip/TooltipContent.astro",
    );
    const reactTooltipContent = await readGeneratedFile(
      reactOutputRoot,
      "tooltip/TooltipContent.tsx",
    );
    const astroHoverCardContent = await readGeneratedFile(
      astroOutputRoot,
      "hover-card/HoverCardContent.astro",
    );
    const reactHoverCardContent = await readGeneratedFile(
      reactOutputRoot,
      "hover-card/HoverCardContent.tsx",
    );
    const astroTooltipVariants = await readGeneratedFile(astroOutputRoot, "tooltip/variants.ts");
    const reactTooltipVariants = await readGeneratedFile(reactOutputRoot, "tooltip/variants.ts");
    const astroHoverCardVariants = await readGeneratedFile(
      astroOutputRoot,
      "hover-card/variants.ts",
    );
    const reactHoverCardVariants = await readGeneratedFile(
      reactOutputRoot,
      "hover-card/variants.ts",
    );

    for (const content of [astroTooltipContent, reactTooltipContent]) {
      expect(content).toContain('data-slot="tooltip-content"');
      expect(content).toContain("tooltipContent({ class: className })");
      expect(content).not.toContain("tooltipContent({ side, align");
      expect(content).toContain("side={side}");
      expect(content).toContain("align={align}");
      expect(content).toContain("sideOffset={sideOffset}");
    }

    for (const content of [astroHoverCardContent, reactHoverCardContent]) {
      expect(content).toContain('data-slot="hover-card-content"');
      expect(content).toContain("hoverCardContent({ class: className })");
      expect(content).not.toContain("hoverCardContent({ side, align");
      expect(content).toContain("side={side}");
      expect(content).toContain("align={align}");
      expect(content).toContain("sideOffset={sideOffset}");
      expect(content).toContain("avoidCollisions={avoidCollisions}");
    }

    for (const variants of [astroTooltipVariants, reactTooltipVariants]) {
      const tooltipContentVariant = getVariantExport(variants, "tooltipContent");
      const tooltipCaretVariant = getVariantExport(variants, "tooltipCaret");
      expect(tooltipContentVariant).toContain(
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
      );
      expect(tooltipContentVariant).toContain(
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
      );
      expect(tooltipContentVariant).toContain("origin-(--transform-origin)");
      expect(tooltipContentVariant).not.toContain("side: {");
      expect(tooltipContentVariant).not.toContain("align: {");
      expect(tooltipCaretVariant).toContain("group-data-[side=top]:bottom-0");
      expect(tooltipCaretVariant).toContain("group-data-[side=bottom]:top-0");
      expect(tooltipCaretVariant).toContain("group-data-[side=left]:top-1/2");
      expect(tooltipCaretVariant).toContain("group-data-[side=right]:top-1/2");
    }

    for (const variants of [astroHoverCardVariants, reactHoverCardVariants]) {
      const hoverCardContentVariant = getVariantExport(variants, "hoverCardContent");
      expect(hoverCardContentVariant).toContain(
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
      );
      expect(hoverCardContentVariant).toContain(
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
      );
      expect(hoverCardContentVariant).toContain("origin-(--transform-origin)");
      expect(hoverCardContentVariant).not.toContain("side: {");
      expect(hoverCardContentVariant).not.toContain("align: {");
    }
  });
});
