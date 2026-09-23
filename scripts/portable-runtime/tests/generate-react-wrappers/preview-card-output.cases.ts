import { assertTypeScriptModule, compactCode } from "../source-comparison.js";
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
    assertTypeScriptModule(root); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(trigger)).toContain(
      compactCode(
        'export type PreviewCardTriggerProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "disabled"> &',
      ),
    );
    expect(compactCode(trigger)).toContain(compactCode("asChild?: boolean;"));
    expect(compactCode(trigger)).toContain(compactCode("React.cloneElement"));
    expect(compactCode(trigger)).toContain(compactCode('"data-sw-preview-card-trigger": ""'));
    expect(compactCode(trigger)).toContain(
      compactCode("mergeAsChildProps({ ...triggerProps, className }, childProps"),
    );
    expect(compactCode(trigger)).toContain(compactCode('eventOrder: "parent-first"'));
    expect(compactCode(trigger)).toContain(compactCode("protectedProps: protectedTriggerProps"));
    expect(compactCode(trigger)).toContain(compactCode("event.preventDefault();"));
    expect(compactCode(trigger)).toContain(compactCode("event.stopPropagation();"));
    expect(compactCode(trigger)).toContain(compactCode("<a"));
    expect(compactCode(trigger)).toContain(compactCode("href: disabled ? undefined : href"));
    expect(compactCode(trigger)).toContain(compactCode("tabIndex: disabled ? -1 : tabIndex"));
    expect(compactCode(trigger)).toContain(
      compactCode("...(disabled ? { href: undefined, tabIndex: -1 } : {})"),
    );
    expect(
      compactCode(
        trigger.slice(
          trigger.indexOf("const protectedTriggerProps = {"),
          trigger.indexOf("const triggerProps = {"),
        ),
      ),
    ).not.toContain(compactCode("href: disabled ? undefined : href"));
    expect(compactCode(trigger)).toContain(compactCode("href={disabled ? undefined : href}"));
    expect(compactCode(trigger)).toContain(compactCode("tabIndex={disabled ? -1 : tabIndex}"));
    expect(compactCode(trigger)).not.toContain(compactCode("<button"));
    expect(compactCode(positioner)).toContain(compactCode("data-sw-preview-card-positioner"));
    expect(compactCode(positioner)).toContain(compactCode('side = "bottom"'));
    expect(compactCode(positioner)).toContain(compactCode('align = "center"'));
    expect(compactCode(positioner)).toContain(compactCode("sideOffset = 0"));
    expect(compactCode(popup)).toContain(compactCode("data-sw-preview-card-popup"));
    expect(compactCode(popup)).toContain(compactCode('role="tooltip"'));
    expect(compactCode(popup)).toContain(compactCode("sideOffset = 0"));
    expect(compactCode(popup)).toContain(compactCode("hidden"));
    expect(compactCode(backdrop)).toContain(compactCode("data-sw-preview-card-backdrop"));
    expect(compactCode(backdrop)).toContain(compactCode("hidden"));
    expect(compactCode(viewport)).toContain(compactCode("data-sw-preview-card-viewport"));
    expect(compactCode(arrow)).toContain(compactCode("data-sw-preview-card-arrow"));
    expect(compactCode(index)).toContain(compactCode("const PreviewCard ="));
    expect(compactCode(index)).toContain(compactCode("Root: PreviewCardRoot"));
    expect(compactCode(index)).toContain(compactCode("Viewport: PreviewCardViewport"));
    expect(compactCode(index)).toContain(
      compactCode('export type { PreviewCardOpenChangeDetails } from "@starwind-ui/runtime"'),
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

    expect(compactCode(root)).toContain(
      compactCode('PreviewCardPrimitive from "../primitives/react/preview-card"'),
    );
    expect(compactCode(root)).toContain(compactCode("<PreviewCardPrimitive.Root"));
    expect(compactCode(root)).toContain(compactCode("open?: boolean;"));
    expect(compactCode(root)).toContain(compactCode("open={open}"));
    expect(compactCode(root)).toContain(compactCode("onOpenChange={onOpenChange}"));
    expect(compactCode(root)).toContain(compactCode("openDelay = 600"));
    expect(compactCode(root)).toContain(compactCode("closeDelay = 300"));
    expect(compactCode(root)).toContain(compactCode("disableHoverableContent = false"));
    expect(compactCode(root)).toContain(compactCode('data-slot="hover-card"'));
    expect(compactCode(trigger)).toContain(compactCode('React.ComponentPropsWithoutRef<"a">'));
    expect(compactCode(trigger)).toContain(compactCode("<PreviewCardPrimitive.Trigger"));
    expect(compactCode(trigger)).toContain(compactCode("asChild={asChild}"));
    expect(compactCode(trigger)).toContain(
      compactCode("const triggerBaseClassName = hoverCardTrigger({ class: className });"),
    );
    expect(compactCode(trigger)).toContain(
      compactCode("const triggerClassName = asChild ? className : triggerBaseClassName;"),
    );
    expect(compactCode(trigger)).toContain(compactCode("className={triggerClassName}"));
    expect(compactCode(trigger)).not.toContain(
      compactCode("className={hoverCardTrigger({ class: className })}"),
    );
    expect(compactCode(content)).toContain(compactCode("<PreviewCardPrimitive.Portal"));
    expect(compactCode(content)).toContain(compactCode("<PreviewCardPrimitive.Positioner"));
    expect(compactCode(content)).toContain(compactCode("<PreviewCardPrimitive.Popup"));
    expect(compactCode(content)).toContain(compactCode('side = "bottom"'));
    expect(compactCode(content)).toContain(compactCode('align = "center"'));
    expect(compactCode(content)).toContain(compactCode("sideOffset = 4"));
    expect(compactCode(content)).toContain(compactCode("positionerClassName?: string;"));
    expect(compactCode(content)).toContain(
      compactCode("className={hoverCardPositioner({ class: positionerClassName })}"),
    );
    expect(compactCode(content)).not.toContain(compactCode("isolate"));
    expect(compactCode(content)).not.toContain(compactCode("animationDuration"));
    expect(compactCode(content)).toContain(compactCode('data-slot="hover-card-content"'));
    expect(compactCode(variants)).not.toContain(compactCode("starwind-hover-card"));
    expect(compactCode(variants)).toContain(compactCode("bg-popover text-popover-foreground"));
    expect(compactCode(variants)).toContain(compactCode("export const hoverCardPositioner"));
    expect(compactCode(variants)).toContain(compactCode('base: "z-50"'));
    expect(compactCode(variants)).not.toContain(compactCode("text-popover-foreground z-50 hidden"));
    expect(compactCode(variants)).toContain(compactCode("duration-100"));
    expect(compactCode(variants)).toContain(compactCode("data-[state=closed]:animate-out"));
    expect(compactCode(index)).toContain(compactCode("Root: HoverCard"));
    expect(compactCode(index)).toContain(compactCode("Trigger: HoverCardTrigger"));
    expect(compactCode(index)).toContain(compactCode("Content: HoverCardContent"));
  });
}
