import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateReactPrimitiveWrappers,
  generateStarwindReactWrappers,
  it,
  path,
  readdir,
  readGeneratedFile,
} from "./shared.js";

export function defineReactPreviewCardOutputTests(getTempRoot: GetTempRoot): void {
  it("generates React preview-card primitive wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/react");
    const generatedPrimitiveEntries = (await readdir(outputRoot)).sort();
    const root = await readGeneratedFile(outputRoot, "preview-card/PreviewCardRoot.tsx");
    const trigger = await readGeneratedFile(outputRoot, "preview-card/PreviewCardTrigger.tsx");
    const positioner = await readGeneratedFile(
      outputRoot,
      "preview-card/PreviewCardPositioner.tsx",
    );
    const popup = await readGeneratedFile(outputRoot, "preview-card/PreviewCardPopup.tsx");
    const backdrop = await readGeneratedFile(outputRoot, "preview-card/PreviewCardBackdrop.tsx");
    const viewport = await readGeneratedFile(outputRoot, "preview-card/PreviewCardViewport.tsx");
    const arrow = await readGeneratedFile(outputRoot, "preview-card/PreviewCardArrow.tsx");
    const index = await readGeneratedFile(outputRoot, "preview-card/index.ts");

    expect(generatedPrimitiveEntries).toContain("preview-card");
    expect(root).toContain(
      'import { createPreviewCard, type PreviewCardOpenChangeDetails } from "@starwind-ui/runtime/preview-card";',
    );
    expect(root).toContain("open?: boolean;");
    expect(root).toContain("onOpenChange?:");
    expect(root).toContain("openDelay = 600");
    expect(root).toContain("closeDelay = 300");
    expect(root).toContain('data-content-hoverable={!disableHoverableContent ? "true" : "false"}');
    expect(root).toContain("instance.setOpen(open, { emit: false })");
    expect(trigger).toContain(
      'export type PreviewCardTriggerProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "disabled"> &',
    );
    expect(trigger).toContain("asChild?: boolean;");
    expect(trigger).toContain("React.cloneElement");
    expect(trigger).toContain('"data-sw-preview-card-trigger": ""');
    expect(trigger).toContain("mergeAsChildProps({ ...triggerProps, className }, childProps");
    expect(trigger).toContain('eventOrder: "parent-first"');
    expect(trigger).toContain("protectedProps: protectedTriggerProps");
    expect(trigger).toContain("event.preventDefault();");
    expect(trigger).toContain("event.stopPropagation();");
    expect(trigger).toContain("<a");
    expect(trigger).toContain("href: disabled ? undefined : href");
    expect(trigger).toContain("tabIndex: disabled ? -1 : tabIndex");
    expect(trigger).toContain("...(disabled ? { href: undefined, tabIndex: -1 } : {})");
    expect(
      trigger.slice(
        trigger.indexOf("const protectedTriggerProps = {"),
        trigger.indexOf("const triggerProps = {"),
      ),
    ).not.toContain("href: disabled ? undefined : href");
    expect(trigger).toContain("href={disabled ? undefined : href}");
    expect(trigger).toContain("tabIndex={disabled ? -1 : tabIndex}");
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

  it("generates React hover-card styled wrappers from preview-card primitives", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/starwind-runtime");
    const root = await readGeneratedFile(outputRoot, "hover-card/HoverCard.tsx");
    const trigger = await readGeneratedFile(outputRoot, "hover-card/HoverCardTrigger.tsx");
    const content = await readGeneratedFile(outputRoot, "hover-card/HoverCardContent.tsx");
    const variants = await readGeneratedFile(outputRoot, "hover-card/variants.ts");
    const index = await readGeneratedFile(outputRoot, "hover-card/index.ts");

    expect(root).toContain('PreviewCardPrimitive from "../primitives/react/preview-card"');
    expect(root).toContain("<PreviewCardPrimitive.Root");
    expect(root).toContain("open?: boolean;");
    expect(root).toContain("open={open}");
    expect(root).toContain("onOpenChange={onOpenChange}");
    expect(root).toContain("openDelay = 600");
    expect(root).toContain("closeDelay = 300");
    expect(root).toContain("disableHoverableContent = false");
    expect(root).toContain('data-slot="hover-card"');
    expect(trigger).toContain('React.ComponentPropsWithoutRef<"a">');
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
