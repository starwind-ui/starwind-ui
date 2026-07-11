import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateAstroPrimitiveWrappers,
  generateStarwindAstroWrappers,
  it,
  path,
  readdir,
  readGeneratedFile,
} from "./shared.js";

export function defineAstroPreviewCardOutputTests(getTempRoot: GetTempRoot): void {
  it("generates Astro preview-card primitive wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/astro");
    const generatedPrimitiveEntries = (await readdir(outputRoot)).sort();
    const root = await readGeneratedFile(outputRoot, "preview-card/PreviewCardRoot.astro");
    const trigger = await readGeneratedFile(outputRoot, "preview-card/PreviewCardTrigger.astro");
    const positioner = await readGeneratedFile(
      outputRoot,
      "preview-card/PreviewCardPositioner.astro",
    );
    const popup = await readGeneratedFile(outputRoot, "preview-card/PreviewCardPopup.astro");
    const backdrop = await readGeneratedFile(outputRoot, "preview-card/PreviewCardBackdrop.astro");
    const viewport = await readGeneratedFile(outputRoot, "preview-card/PreviewCardViewport.astro");
    const arrow = await readGeneratedFile(outputRoot, "preview-card/PreviewCardArrow.astro");
    const index = await readGeneratedFile(outputRoot, "preview-card/index.ts");

    expect(generatedPrimitiveEntries).toContain("preview-card");
    expect(root).toContain('import { createPreviewCard } from "@starwind-ui/runtime/preview-card"');
    expect(root).toContain("data-sw-preview-card");
    expect(root).toContain("openDelay = 600");
    expect(root).toContain("closeDelay = 300");
    expect(root).toContain('data-content-hoverable={!disableHoverableContent ? "true" : "false"}');
    expect(root).toContain(
      'registerAstroControllerLifecycle("PreviewCardRoot", setupPreviewCards)',
    );
    expect(trigger).toContain('type Props = HTMLAttributes<"a"> &');
    expect(trigger).toContain("asChild?: boolean;");
    expect(trigger).toContain("data-sw-preview-card-trigger");
    expect(trigger).toContain("data-as-child");
    expect(trigger).toContain("<a");
    expect(trigger).toContain("const asChildTransferAttributes =");
    expect(trigger).toContain("href={disabled ? undefined : href}");
    expect(trigger).toContain("tabindex={disabled ? -1 : tabindex}");
    expect(trigger).not.toContain("<button");
    expect(positioner).toContain("data-sw-preview-card-positioner");
    expect(positioner).toContain('side = "bottom"');
    expect(positioner).toContain('align = "center"');
    expect(positioner).toContain("sideOffset = 0");
    expect(popup).toContain("data-sw-preview-card-popup");
    expect(popup).toContain('role="tooltip"');
    expect(popup).toContain("sideOffset = 0");
    expect(popup).toContain("hidden");
    expect(backdrop).toContain("data-sw-preview-card-backdrop");
    expect(backdrop).toContain("hidden");
    expect(viewport).toContain("data-sw-preview-card-viewport");
    expect(arrow).toContain("data-sw-preview-card-arrow");
    expect(index).toContain("const PreviewCard =");
    expect(index).toContain("Root: PreviewCardRoot");
    expect(index).toContain("Viewport: PreviewCardViewport");
    expect(index).toContain(
      'export type { PreviewCardOpenChangeDetails } from "@starwind-ui/runtime"',
    );
  });

  it("generates Astro hover-card styled wrappers from preview-card primitives", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    const root = await readGeneratedFile(outputRoot, "hover-card/HoverCard.astro");
    const trigger = await readGeneratedFile(outputRoot, "hover-card/HoverCardTrigger.astro");
    const content = await readGeneratedFile(outputRoot, "hover-card/HoverCardContent.astro");
    const variants = await readGeneratedFile(outputRoot, "hover-card/variants.ts");
    const index = await readGeneratedFile(outputRoot, "hover-card/index.ts");

    expect(root).toContain('PreviewCardPrimitive from "../primitives/astro/preview-card"');
    expect(root).toContain("<PreviewCardPrimitive.Root");
    expect(root).toContain("openDelay = 600");
    expect(root).toContain("closeDelay = 300");
    expect(root).toContain("disableHoverableContent = false");
    expect(root).toContain('data-slot="hover-card"');
    expect(trigger).toContain('HTMLAttributes<"a">');
    expect(trigger).toContain("<PreviewCardPrimitive.Trigger");
    expect(trigger).toContain("asChild={asChild}");
    expect(trigger).toContain("hoverCardTrigger({ class: className })");
    expect(content).toContain("<PreviewCardPrimitive.Portal");
    expect(content).toContain("<PreviewCardPrimitive.Positioner");
    expect(content).toContain("<PreviewCardPrimitive.Popup");
    expect(content).toContain('side = "bottom"');
    expect(content).toContain('align = "center"');
    expect(content).toContain("sideOffset = 4");
    expect(content).not.toContain("animationDuration");
    expect(content).toContain('data-slot="hover-card-content"');
    expect(variants).not.toContain("starwind-hover-card");
    expect(variants).toContain("bg-popover text-popover-foreground");
    expect(variants).toContain("duration-100");
    expect(variants).toContain("data-[state=closed]:animate-out");
    expect(index).toContain("Root: HoverCard");
    expect(index).toContain("Trigger: HoverCardTrigger");
    expect(index).toContain("Content: HoverCardContent");
  });
}
