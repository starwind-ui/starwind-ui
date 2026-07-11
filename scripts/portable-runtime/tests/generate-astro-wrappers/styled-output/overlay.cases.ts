import { expect, readGeneratedFile } from "../shared.js";

export async function assertAstroStyledOverlayOutput(outputRoot: string): Promise<void> {
  const dialog = await readGeneratedFile(outputRoot, "dialog/Dialog.astro");
  const dialogTrigger = await readGeneratedFile(outputRoot, "dialog/DialogTrigger.astro");
  const dialogClose = await readGeneratedFile(outputRoot, "dialog/DialogClose.astro");
  const dialogContent = await readGeneratedFile(outputRoot, "dialog/DialogContent.astro");
  const dialogStyles = await readGeneratedFile(outputRoot, "dialog/styles.css");
  const dialogVariants = await readGeneratedFile(outputRoot, "dialog/variants.ts");
  const dialogIndex = await readGeneratedFile(outputRoot, "dialog/index.ts");
  const sheet = await readGeneratedFile(outputRoot, "sheet/Sheet.astro");
  const sheetTrigger = await readGeneratedFile(outputRoot, "sheet/SheetTrigger.astro");
  const sheetContent = await readGeneratedFile(outputRoot, "sheet/SheetContent.astro");
  const sheetClose = await readGeneratedFile(outputRoot, "sheet/SheetClose.astro");
  const sheetVariants = await readGeneratedFile(outputRoot, "sheet/variants.ts");
  const sheetIndex = await readGeneratedFile(outputRoot, "sheet/index.ts");
  const dropdown = await readGeneratedFile(outputRoot, "dropdown/Dropdown.astro");
  const dropdownVariants = await readGeneratedFile(outputRoot, "dropdown/variants.ts");
  const dropdownTrigger = await readGeneratedFile(outputRoot, "dropdown/DropdownTrigger.astro");
  const dropdownCheckboxItem = await readGeneratedFile(
    outputRoot,
    "dropdown/DropdownCheckboxItem.astro",
  );
  const dropdownCheckboxItemIndicator = await readGeneratedFile(
    outputRoot,
    "dropdown/DropdownCheckboxItemIndicator.astro",
  );
  const dropdownRadioGroup = await readGeneratedFile(
    outputRoot,
    "dropdown/DropdownRadioGroup.astro",
  );
  const dropdownRadioItem = await readGeneratedFile(outputRoot, "dropdown/DropdownRadioItem.astro");
  const dropdownRadioItemIndicator = await readGeneratedFile(
    outputRoot,
    "dropdown/DropdownRadioItemIndicator.astro",
  );
  const dropdownIndex = await readGeneratedFile(outputRoot, "dropdown/index.ts");
  const contextMenuVariants = await readGeneratedFile(outputRoot, "context-menu/variants.ts");
  const contextMenu = await readGeneratedFile(outputRoot, "context-menu/ContextMenu.astro");
  const contextMenuCheckboxItemIndicator = await readGeneratedFile(
    outputRoot,
    "context-menu/ContextMenuCheckboxItemIndicator.astro",
  );
  const contextMenuRadioGroup = await readGeneratedFile(
    outputRoot,
    "context-menu/ContextMenuRadioGroup.astro",
  );
  const contextMenuRadioItem = await readGeneratedFile(
    outputRoot,
    "context-menu/ContextMenuRadioItem.astro",
  );
  const contextMenuRadioItemIndicator = await readGeneratedFile(
    outputRoot,
    "context-menu/ContextMenuRadioItemIndicator.astro",
  );
  const contextMenuIndex = await readGeneratedFile(outputRoot, "context-menu/index.ts");
  const popover = await readGeneratedFile(outputRoot, "popover/Popover.astro");
  const popoverTrigger = await readGeneratedFile(outputRoot, "popover/PopoverTrigger.astro");
  const popoverContent = await readGeneratedFile(outputRoot, "popover/PopoverContent.astro");
  const popoverVariants = await readGeneratedFile(outputRoot, "popover/variants.ts");
  const popoverIndex = await readGeneratedFile(outputRoot, "popover/index.ts");
  const navigationMenu = await readGeneratedFile(
    outputRoot,
    "navigation-menu/NavigationMenu.astro",
  );
  const navigationMenuTrigger = await readGeneratedFile(
    outputRoot,
    "navigation-menu/NavigationMenuTrigger.astro",
  );
  const navigationMenuLink = await readGeneratedFile(
    outputRoot,
    "navigation-menu/NavigationMenuLink.astro",
  );
  const navigationMenuPositioner = await readGeneratedFile(
    outputRoot,
    "navigation-menu/NavigationMenuPositioner.astro",
  );
  const navigationMenuVariants = await readGeneratedFile(outputRoot, "navigation-menu/variants.ts");
  const navigationMenuIndex = await readGeneratedFile(outputRoot, "navigation-menu/index.ts");
  const tooltip = await readGeneratedFile(outputRoot, "tooltip/Tooltip.astro");
  const tooltipTrigger = await readGeneratedFile(outputRoot, "tooltip/TooltipTrigger.astro");
  const tooltipContent = await readGeneratedFile(outputRoot, "tooltip/TooltipContent.astro");
  const tooltipVariants = await readGeneratedFile(outputRoot, "tooltip/variants.ts");
  const tooltipIndex = await readGeneratedFile(outputRoot, "tooltip/index.ts");
  const alertDialog = await readGeneratedFile(outputRoot, "alert-dialog/AlertDialog.astro");
  const alertDialogTrigger = await readGeneratedFile(
    outputRoot,
    "alert-dialog/AlertDialogTrigger.astro",
  );
  const alertDialogContent = await readGeneratedFile(
    outputRoot,
    "alert-dialog/AlertDialogContent.astro",
  );
  const alertDialogAction = await readGeneratedFile(
    outputRoot,
    "alert-dialog/AlertDialogAction.astro",
  );
  const alertDialogCancel = await readGeneratedFile(
    outputRoot,
    "alert-dialog/AlertDialogCancel.astro",
  );
  const alertDialogVariants = await readGeneratedFile(outputRoot, "alert-dialog/variants.ts");
  const alertDialogIndex = await readGeneratedFile(outputRoot, "alert-dialog/index.ts");

  expect(dialog).toContain('DialogPrimitive from "../primitives/astro/dialog"');
  expect(dialog).toContain("<DialogPrimitive.Root");
  expect(dialog).not.toContain("@starwind-ui/runtime");
  expect(dialog).toContain("closeOnEscape={closeOnEscape}");
  expect(dialog).toContain("closeOnOutsideInteract={closeOnOutsideInteract}");
  expect(dialogTrigger).toContain("asChild?: boolean;");
  expect(dialogTrigger).toContain("targetId?: string;");
  expect(dialogTrigger).toContain("targetId,");
  expect(dialogTrigger).toContain("targetId={targetId}");
  expect(dialogTrigger).toContain("data-sw-dialog-target-id={targetId}");
  expect(dialogTrigger).not.toContain("for?: string;");
  expect(dialogTrigger).not.toContain("dialogFor");
  expect(dialogTrigger).not.toContain("data-dialog-for");
  expect(dialogTrigger).toContain("data-as-child");
  expect(dialogTrigger).toContain("data-sw-dialog-trigger");
  expect(dialogClose).toContain("asChild?: boolean;");
  expect(dialogClose).toContain("data-as-child");
  expect(dialogClose).toContain("data-sw-dialog-close");
  expect(dialogContent).toContain("<DialogPrimitive.Backdrop");
  expect(dialogContent).toContain("<DialogPrimitive.Popup");
  expect(dialogContent).toContain('import { Button } from "../button";');
  expect(dialogContent).not.toContain("<DialogPrimitive.Close");
  expect(dialogContent).toContain("<Button");
  expect(dialogContent).toContain('variant="ghost"');
  expect(dialogContent).toContain('size="icon-sm"');
  expect(dialogContent).toContain("class={dialogCloseButton()}");
  expect(dialogContent).toContain("data-sw-dialog-close");
  expect(dialogContent).toContain('import "./styles.css";');
  expect(dialogContent).toContain('data-slot="dialog-backdrop"');
  expect(dialogContent).toContain('data-slot="dialog-content"');
  expect(dialogContent).toContain('data-slot="dialog-close"');
  expect(dialogContent).not.toContain("animationDuration");
  expect(dialogStyles).toContain("[data-sw-dialog-content] {");
  expect(dialogStyles).not.toContain(".starwind-dialog-content");
  expect(dialogStyles).toContain("--nested-offset: 1rem;");
  expect(dialogStyles).toContain("--nested-scale: 0.05;");
  expect(dialogVariants).toContain("duration-200");
  expect(dialogVariants).toContain(
    "data-[state=open]:data-nested-dialog-open:scale-[calc(1-var(--nested-scale)*var(--nested-dialogs,1))]",
  );
  expect(dialogVariants).toContain(
    "data-[state=open]:data-nested-dialog-open:-translate-y-[calc(50%-var(--nested-offset)*var(--nested-dialogs,1))]",
  );
  expect(dialogIndex).toContain("DialogHeader");
  expect(dialogIndex).toContain("DialogFooter");
  expect(dialogIndex).not.toContain("styles.css");
  expect(dialogIndex).not.toContain("DialogOverlay");
  expect(sheet).toContain('SheetPrimitive from "../primitives/astro/drawer"');
  expect(sheet).toContain("<SheetPrimitive.Root");
  expect(sheet).not.toContain("@starwind-ui/runtime");
  expect(sheet).toContain("closeOnOutsideInteract={closeOnOutsideInteract}");
  expect(sheet).toContain('data-slot="sheet"');
  expect(sheetTrigger).toContain("asChild?: boolean;");
  expect(sheetTrigger).toContain("targetId?: string;");
  expect(sheetTrigger).toContain("targetId,");
  expect(sheetTrigger).toContain("targetId={targetId}");
  expect(sheetTrigger).toContain("data-sw-drawer-target-id={targetId}");
  expect(sheetTrigger).not.toContain("for?: string;");
  expect(sheetTrigger).not.toContain("dialogFor");
  expect(sheetTrigger).not.toContain("data-dialog-for");
  expect(sheetTrigger).toContain("data-as-child");
  expect(sheetTrigger).toContain("data-sw-drawer-trigger");
  expect(sheetContent).toContain("<SheetPrimitive.Backdrop");
  expect(sheetContent).toContain("<SheetPrimitive.Popup");
  expect(sheetContent).toContain('import { Button } from "../button";');
  expect(sheetContent).not.toContain("<SheetPrimitive.Close");
  expect(sheetContent).toContain("<Button");
  expect(sheetContent).toContain('variant="ghost"');
  expect(sheetContent).toContain('size="icon-sm"');
  expect(sheetContent).toContain("class={sheetCloseButton()}");
  expect(sheetContent).toContain("data-sw-drawer-close");
  expect(sheetContent).toContain('side = "right"');
  expect(sheetContent).toContain("sheetContent({ side, class: className })");
  expect(sheetContent).toContain("side={side}");
  expect(sheetContent).not.toContain("data-side={side}");
  expect(sheetContent).toContain('data-slot="sheet-backdrop"');
  expect(sheetContent).toContain('data-slot="sheet-content"');
  expect(sheetContent).toContain('data-slot="sheet-close"');
  expect(sheetContent).toContain('<span class="sr-only">Close sheet</span>');
  expect(sheetContent).not.toContain('aria-label="Close dialog"');
  expect(sheetClose).toContain("asChild?: boolean;");
  expect(sheetClose).toContain("data-as-child");
  expect(sheetClose).toContain("data-sw-drawer-close");
  expect(sheetClose).toContain("<SheetPrimitive.Close");
  expect(sheetClose).not.toContain("starwind-sheet-close");
  expect(sheetClose).toContain("const closeClassName = className;");
  expect(sheetClose).toContain("class={closeClassName}");
  expect(sheetClose).not.toContain("sheetCloseButton({ class: className })");
  expect(sheetVariants).not.toContain("starwind-sheet");
  expect(sheetVariants).not.toContain("starwind-dialog");
  expect(sheetVariants).toContain("slide-out-to-right slide-in-from-right");
  expect(sheetVariants).toContain("inset-y-0 right-0 left-auto");
  expect(sheetIndex).toContain("SheetHeader");
  expect(sheetIndex).toContain("SheetFooter");
  expect(sheetIndex).toContain("Root: Sheet");
  expect(dropdownVariants).toContain(
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
  );
  expect(dropdown).toContain("modal?: boolean;");
  expect(dropdown).toContain("modal = false");
  expect(dropdown).toContain("modal={modal}");
  expect(dropdownTrigger).toContain("asChild?: boolean;");
  expect(dropdownTrigger).toContain("<MenuPrimitive.Trigger");
  expect(dropdownTrigger).toContain("asChild={asChild}");
  expect(dropdownTrigger).toContain("dropdownTrigger({ class: className })");
  expect(dropdownTrigger).toContain(
    "const triggerClassName = asChild ? className : triggerBaseClassName;",
  );
  expect(dropdownTrigger).toContain("class={triggerClassName}");
  expect(dropdownTrigger).not.toContain("data-as-child");
  expect(dropdownVariants).toContain("hover:bg-accent hover:text-accent-foreground");
  expect(dropdownVariants).toContain("group-data-highlighted/dropdown-item:text-accent-foreground");
  expect(dropdownCheckboxItem).toContain("<MenuPrimitive.CheckboxItemIndicator");
  expect(dropdownCheckboxItem).toContain("showIndicator = true");
  expect(dropdownCheckboxItem).toContain("showIndicator && (");
  expect(dropdownCheckboxItem).toContain(
    "dropdownCheckboxItemIndicator({ class: indicatorClassName })",
  );
  expect(dropdownCheckboxItemIndicator).toContain("<MenuPrimitive.CheckboxItemIndicator");
  expect(dropdownCheckboxItemIndicator).toContain('data-slot="dropdown-checkbox-item-indicator"');
  expect(dropdownRadioGroup).toContain("<MenuPrimitive.RadioGroup");
  expect(dropdownRadioGroup).toContain("value={value}");
  expect(dropdownRadioItem).toContain("<MenuPrimitive.RadioItem");
  expect(dropdownRadioItem).toContain("dropdownRadioItem({ inset, disabled");
  expect(dropdownRadioItem).toContain("showIndicator = true");
  expect(dropdownRadioItem).toContain("showIndicator && (");
  expect(dropdownRadioItem).toContain("<MenuPrimitive.RadioItemIndicator");
  expect(dropdownRadioItemIndicator).toContain("<MenuPrimitive.RadioItemIndicator");
  expect(dropdownRadioItemIndicator).toContain('data-slot="dropdown-radio-item-indicator"');
  expect(dropdownIndex).toContain("DropdownCheckboxItemIndicator");
  expect(dropdownIndex).toContain("DropdownRadioGroup");
  expect(dropdownIndex).toContain("RadioItemIndicator: DropdownRadioItemIndicator");
  expect(contextMenuVariants).toContain(
    "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
  );
  expect(contextMenuVariants).toContain("hover:bg-accent hover:text-accent-foreground");
  expect(contextMenuVariants).toContain(
    "group-data-highlighted/context-menu-item:text-accent-foreground",
  );
  expect(contextMenu).toContain("modal?: boolean;");
  expect(contextMenu).toContain("modal = true");
  expect(contextMenu).toContain("modal={modal}");
  expect(contextMenuCheckboxItemIndicator).toContain("<ContextMenuPrimitive.CheckboxItemIndicator");
  expect(contextMenuRadioGroup).toContain("<ContextMenuPrimitive.RadioGroup");
  expect(contextMenuRadioItem).toContain("<ContextMenuPrimitive.RadioItem");
  expect(contextMenuRadioItemIndicator).toContain("<ContextMenuPrimitive.RadioItemIndicator");
  expect(contextMenuIndex).toContain("ContextMenuCheckboxItemIndicator");
  expect(contextMenuIndex).toContain("ContextMenuRadioGroup");
  expect(contextMenuIndex).toContain("RadioItemIndicator: ContextMenuRadioItemIndicator");
  expect(popover).toContain('PopoverPrimitive from "../primitives/astro/popover"');
  expect(popover).toContain("<PopoverPrimitive.Root");
  expect(popover).toContain("modal?: boolean");
  expect(popover).toContain("modal = false");
  expect(popover).toContain("modal={modal}");
  expect(popover).toContain("openOnHover={openOnHover}");
  expect(popover).toContain('data-slot="popover"');
  expect(popoverTrigger).toContain("<PopoverPrimitive.Trigger");
  expect(popoverTrigger).toContain("asChild={asChild}");
  expect(popoverTrigger).toContain("popoverTrigger({ class: className })");
  expect(popoverTrigger).toContain('data-slot="popover-trigger"');
  expect(popoverTrigger).not.toContain("data-as-child");
  expect(popoverContent).toContain("<PopoverPrimitive.Portal");
  expect(popoverContent).toContain("<PopoverPrimitive.Popup");
  expect(popoverContent).toContain('side = "bottom"');
  expect(popoverContent).toContain('align = "center"');
  expect(popoverContent).toContain("popoverContent({ class: className })");
  expect(popoverContent).not.toContain("popoverContent({ side, align");
  expect(popoverContent).toContain("side={side}");
  expect(popoverContent).toContain("align={align}");
  expect(popoverContent).toContain("sideOffset={sideOffset}");
  expect(popoverContent).toContain('data-slot="popover-content"');
  expect(popoverVariants).not.toContain("starwind-popover");
  expect(popoverVariants).toContain("data-[state=open]:animate-in fade-in zoom-in-95");
  expect(popoverVariants).toContain(
    "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2",
  );
  expect(popoverVariants).toContain(
    "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
  );
  expect(popoverVariants).toContain("origin-(--transform-origin)");
  expect(popoverIndex).toContain("PopoverHeader");
  expect(popoverIndex).toContain("Root: Popover");
  expect(navigationMenu).toContain(
    'NavigationMenuPrimitive from "../primitives/astro/navigation-menu"',
  );
  expect(navigationMenu).toContain("<NavigationMenuPrimitive.Root");
  expect(navigationMenu).toContain("value?: string | null;");
  expect(navigationMenu).toContain("value,");
  expect(navigationMenu).toContain("value={value}");
  expect(navigationMenu).toContain("openDelay = 50");
  expect(navigationMenu).toContain("closeDelay = 50");
  expect(navigationMenu).toContain("sideOffset = 8");
  expect(navigationMenu).toContain("openDelay={openDelay}");
  expect(navigationMenu).toContain("closeDelay={closeDelay}");
  expect(navigationMenu).toContain(
    'import NavigationMenuPositioner from "./NavigationMenuPositioner.astro";',
  );
  expect(navigationMenu).toContain("<NavigationMenuPositioner");
  expect(navigationMenu).toContain("side={side}");
  expect(navigationMenu).toContain("align={align}");
  expect(navigationMenu).toContain("sideOffset={sideOffset}");
  expect(navigationMenu).toContain("alignOffset={alignOffset}");
  expect(navigationMenu).toContain("avoidCollisions={avoidCollisions}");
  expect(navigationMenu).toContain("collisionPadding={collisionPadding}");
  expect(navigationMenu).not.toContain("<NavigationMenuPrimitive.Portal");
  expect(navigationMenu).not.toContain("<NavigationMenuPrimitive.Positioner");
  expect(navigationMenu).not.toContain("<NavigationMenuPrimitive.Popup");
  expect(navigationMenu).not.toContain("<NavigationMenuPrimitive.Viewport");
  expect(navigationMenu).not.toContain("@starwind-ui/runtime");
  expect(navigationMenuTrigger).toContain("<NavigationMenuPrimitive.Trigger");
  expect(navigationMenuTrigger).toContain("openDelay={openDelay}");
  expect(navigationMenuTrigger).toContain("closeDelay={closeDelay}");
  expect(navigationMenuTrigger).toContain("<NavigationMenuPrimitive.Icon");
  expect(navigationMenuTrigger).toContain("showIcon = true");
  expect(navigationMenuTrigger).toContain(
    'import ChevronDown from "@tabler/icons/outline/chevron-down.svg";',
  );
  expect(navigationMenuTrigger).toContain("<ChevronDown />");
  expect(navigationMenuTrigger).toContain('data-slot="navigation-menu-trigger"');
  expect(navigationMenuLink).toContain("closeOnClick?: boolean;");
  expect(navigationMenuLink).toContain("closeOnClick = true");
  expect(navigationMenuLink).toContain("closeOnClick={closeOnClick}");
  expect(navigationMenuLink).toContain('data-slot="navigation-menu-link"');
  expect(navigationMenuPositioner).toContain("<NavigationMenuPrimitive.Portal");
  expect(navigationMenuPositioner).toContain("<NavigationMenuPrimitive.Positioner");
  expect(navigationMenuPositioner).toContain("sideOffset = 8");
  expect(navigationMenuPositioner).toContain("<NavigationMenuPrimitive.Popup");
  expect(navigationMenuPositioner).toContain("<NavigationMenuPrimitive.Viewport");
  expect(navigationMenuVariants).not.toContain("starwind-navigation-menu");
  expect(navigationMenuVariants).not.toContain("destructive");
  expect(navigationMenuVariants).toContain(
    "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
  );
  expect(navigationMenuVariants).not.toContain("group/navigation-menu relative z-10");
  expect(navigationMenuVariants).toContain("gap-0");
  expect(navigationMenuVariants).toContain(
    "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all outline-none",
  );
  expect(navigationMenuVariants).toContain("focus-visible:ring-3 focus-visible:outline-1");
  expect(navigationMenuVariants).toContain(
    "relative top-px ml-1 size-3 shrink-0 origin-center transition duration-300 [&>svg]:size-3 [&>svg]:shrink-0",
  );
  expect(navigationMenuVariants).toContain(
    "group-data-[state=open]/navigation-menu-trigger:rotate-180",
  );
  expect(navigationMenuVariants).toContain(
    "data-[state=closed]:pointer-events-none data-[state=closed]:absolute data-[state=closed]:inset-0",
  );
  const navigationMenuContentVariant =
    navigationMenuVariants.match(
      /export const navigationMenuContent = tv\(\{\n  base: \[\n([\s\S]*?)\n  \],\n\}\);/,
    )?.[1] ?? "";
  expect(navigationMenuContentVariant).toContain("transition-opacity");
  expect(navigationMenuContentVariant).not.toContain("translate-x");
  expect(navigationMenuVariants).toContain("data-starting-style:opacity-0");
  expect(navigationMenuVariants).toContain("data-ending-style:opacity-0");
  expect(navigationMenuVariants).not.toContain("data-[state=open]:animate-in");
  expect(navigationMenuVariants).not.toContain("data-[state=closed]:animate-out");
  expect(navigationMenuVariants).not.toContain("slide-in-from-right-4");
  expect(navigationMenuVariants).not.toContain("slide-in-from-left-4");
  expect(navigationMenuVariants).toContain("in-data-[slot=navigation-menu-content]:rounded-md");
  expect(navigationMenuVariants).toContain("flex items-center gap-2 rounded-lg p-2 text-sm");
  expect(navigationMenuVariants).toContain("hover:bg-muted");
  expect(navigationMenuVariants).toContain("focus:bg-muted");
  expect(navigationMenuVariants).not.toContain("flex flex-col gap-1 rounded-sm p-2 text-sm");
  expect(navigationMenuVariants).not.toContain("hover:bg-accent hover:text-accent-foreground");
  expect(navigationMenuVariants).not.toContain("focus:bg-accent focus:text-accent-foreground");
  expect(navigationMenuVariants).toContain("transition-all outline-none");
  const navigationMenuPopupVariant =
    navigationMenuVariants.match(
      /export const navigationMenuPopup = tv\(\{\n  base: \[\n([\s\S]*?)\n  \],\n\}\);/,
    )?.[1] ?? "";
  expect(navigationMenuPopupVariant).toContain(
    "pointer-events-auto h-(--popup-height) w-(--popup-width) origin-(--transform-origin)",
  );
  expect(navigationMenuPopupVariant).toContain("bg-popover text-popover-foreground");
  expect(navigationMenuPopupVariant).toContain("data-starting-style:scale-90");
  expect(navigationMenuPopupVariant).toContain("data-ending-style:scale-90");
  expect(navigationMenuPopupVariant).not.toContain("data-[state=open]:animate-in");
  expect(navigationMenuPopupVariant).not.toContain("data-[state=closed]:animate-out");
  expect(navigationMenuPopupVariant).not.toContain("min-w-[18rem]");
  expect(navigationMenuPopupVariant).toContain("ring-foreground/10");
  expect(navigationMenuPopupVariant).toContain("ring-1");
  expect(navigationMenuPopupVariant).toContain("overflow-hidden");
  expect(navigationMenuVariants).not.toContain("rounded-md border shadow-md");
  expect(navigationMenuVariants).toContain("data-active:bg-muted/50");
  expect(navigationMenuVariants).toContain("data-disabled:pointer-events-none");
  expect(navigationMenuVariants).toContain(
    "group-data-[orientation=vertical]/navigation-menu:flex-col",
  );
  const navigationMenuPositionerVariant =
    navigationMenuVariants.match(
      /export const navigationMenuPositioner = tv\(\{\n  base: \[\n([\s\S]*?)\n  \],\n\}\);/,
    )?.[1] ?? "";
  expect(navigationMenuPositionerVariant).toContain(
    "h-(--positioner-height) w-(--positioner-width)",
  );
  expect(navigationMenuPositionerVariant).not.toContain("flex justify-center");
  expect(navigationMenuVariants).toContain("h-(--popup-height) w-(--popup-width)");
  expect(navigationMenuVariants).not.toContain("--sw-nav-menu-popup-width");
  expect(navigationMenuVariants).not.toContain("--sw-nav-menu-positioner-width");
  expect(navigationMenuVariants).toContain("transition-[top,left,right,bottom,transform]");
  expect(navigationMenuVariants).not.toContain("transition-[left,top,width,height,transform]");
  expect(navigationMenuVariants).toContain("relative size-full overflow-hidden");
  expect(navigationMenuVariants).not.toContain("transition-[width,height]");
  expect(navigationMenuVariants).toContain("data-instant:transition-none");
  expect(navigationMenuIndex).toContain("Root: NavigationMenu");
  expect(navigationMenuIndex).toContain("Trigger: NavigationMenuTrigger");
  expect(navigationMenuIndex).toContain("Positioner: NavigationMenuPositioner");
  expect(navigationMenuIndex.match(/navigationMenuTriggerStyle/g) ?? []).toHaveLength(2);
  expect(tooltip).toContain('TooltipPrimitive from "../primitives/astro/tooltip"');
  expect(tooltip).toContain("<TooltipPrimitive.Root");
  expect(tooltip).toContain('data-slot="tooltip"');
  expect(tooltipTrigger).toContain("<TooltipPrimitive.Trigger");
  expect(tooltipTrigger).toContain("asChild = true");
  expect(tooltipTrigger).toContain('asChild ? "contents" : "inline-flex"');
  expect(tooltipTrigger).toContain('data-slot="tooltip-trigger"');
  expect(tooltipTrigger).not.toContain("openDelay");
  expect(tooltipTrigger).not.toContain("closeDelay");
  expect(tooltipTrigger).not.toContain("data-open-delay");
  expect(tooltipTrigger).not.toContain("data-close-delay");
  expect(tooltipContent).toContain('Omit<HTMLAttributes<"div">');
  expect(tooltipContent).toContain('"tabindex" | "tabIndex"');
  expect(tooltipContent).toContain("<TooltipPrimitive.Popup");
  expect(tooltipContent).toContain('data-slot="tooltip-content"');
  expect(tooltipContent).toContain('class="isolate z-50"');
  expect(tooltipContent).not.toContain("tabindex=");
  expect(tooltipContent).not.toContain("animationDuration");
  expect(tooltipVariants).not.toContain("starwind-tooltip");
  expect(tooltipVariants).toContain("group z-50 hidden");
  expect(tooltipVariants).toContain("duration-150");
  expect(tooltipVariants).toContain(
    "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
  );
  expect(tooltipVariants).toContain(
    "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
  );
  expect(tooltipVariants).toContain("origin-(--transform-origin)");
  expect(tooltipVariants).toContain("[&>svg]:absolute [&>svg]:inset-0");
  expect(tooltipVariants).toContain("group-data-[side=top]:bottom-0");
  expect(tooltipVariants).toContain("group-data-[side=bottom]:top-0");
  expect(tooltipVariants).toContain("group-data-[side=left]:top-1/2");
  expect(tooltipVariants).toContain("group-data-[side=right]:top-1/2");
  expect(tooltipVariants).not.toContain("group fixed");
  expect(tooltipIndex).toContain("Root: Tooltip");
  expect(alertDialog).toContain('AlertDialogPrimitive from "../primitives/astro/alert-dialog"');
  expect(alertDialog).toContain("<AlertDialogPrimitive.Root");
  expect(alertDialog).toContain("closeOnOutsideInteract={closeOnOutsideInteract}");
  expect(alertDialog).toContain('data-slot="alert-dialog"');
  expect(alertDialogTrigger).toContain("asChild?: boolean;");
  expect(alertDialogTrigger).toContain("targetId?: string;");
  expect(alertDialogTrigger).toContain("targetId,");
  expect(alertDialogTrigger).toContain("targetId={targetId}");
  expect(alertDialogTrigger).toContain("data-sw-alert-dialog-target-id={targetId}");
  expect(alertDialogTrigger).not.toContain("for?: string;");
  expect(alertDialogTrigger).not.toContain("dialogFor");
  expect(alertDialogTrigger).not.toContain("data-dialog-for");
  expect(alertDialogTrigger).toContain("data-as-child");
  expect(alertDialogTrigger).toContain("data-sw-alert-dialog-trigger");
  expect(alertDialogContent).toContain("<AlertDialogPrimitive.Backdrop");
  expect(alertDialogContent).toContain("<AlertDialogPrimitive.Popup");
  expect(alertDialogContent).toContain('role="alertdialog"');
  expect(alertDialogContent).toContain('data-slot="alert-dialog-backdrop"');
  expect(alertDialogContent).toContain('data-slot="alert-dialog-content"');
  expect(alertDialogContent).not.toContain("animationDuration");
  expect(alertDialogAction).toContain('import { Button } from "../button"');
  expect(alertDialogAction).toContain("type Props = ComponentProps<typeof Button>");
  expect(alertDialogAction).toContain('variant = "default"');
  expect(alertDialogAction).toContain("<Button");
  expect(alertDialogAction).toContain("variant={variant}");
  expect(alertDialogAction).toContain("size={size}");
  expect(alertDialogAction).not.toContain("<AlertDialogPrimitive.Close");
  expect(alertDialogAction).toContain("asChild?: boolean;");
  expect(alertDialogAction).toContain("data-as-child");
  expect(alertDialogAction).toContain('data-slot="alert-dialog-action"');
  expect(alertDialogAction).toContain("data-sw-alert-dialog-close");
  expect(alertDialogAction).toContain(
    "alertDialogActionAsChild({ variant, size, class: className })",
  );
  expect(alertDialogAction).toContain("alertDialogAction({ class: className })");
  expect(alertDialogCancel).toContain('import { Button } from "../button"');
  expect(alertDialogCancel).toContain("type Props = ComponentProps<typeof Button>");
  expect(alertDialogCancel).toContain('variant = "outline"');
  expect(alertDialogCancel).toContain("<Button");
  expect(alertDialogCancel).toContain("variant={variant}");
  expect(alertDialogCancel).toContain("size={size}");
  expect(alertDialogCancel).not.toContain("<AlertDialogPrimitive.Close");
  expect(alertDialogCancel).toContain("asChild?: boolean;");
  expect(alertDialogCancel).toContain("data-as-child");
  expect(alertDialogCancel).toContain('data-slot="alert-dialog-cancel"');
  expect(alertDialogCancel).toContain("data-sw-alert-dialog-close");
  expect(alertDialogCancel).toContain(
    "alertDialogCancelAsChild({ variant, size, class: className })",
  );
  expect(alertDialogCancel).toContain("alertDialogCancel({ class: className })");
  expect(alertDialogVariants).not.toContain("starwind-alert-dialog");
  expect(alertDialogVariants).toContain("duration-200");
  expect(alertDialogIndex).toContain("AlertDialogAction");
  expect(alertDialogIndex).toContain("Root: AlertDialog");
}
