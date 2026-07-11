import { tv } from "tailwind-variants";

export const navigationMenu = tv({
  base: "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
});

export const navigationMenuList = tv({
  base: [
    "group flex flex-1 list-none items-center justify-center gap-0",
    "group-data-[orientation=vertical]/navigation-menu:flex-col group-data-[orientation=vertical]/navigation-menu:items-stretch",
  ],
});

export const navigationMenuItem = tv({
  base: "relative",
});

export const navigationMenuTrigger = tv({
  base: [
    "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all outline-none",
    "hover:bg-muted focus:bg-muted focus-visible:ring-outline/50 focus-visible:ring-3 focus-visible:outline-1",
    "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
    "data-[state=open]:bg-muted/50 data-[state=open]:hover:bg-muted data-[state=open]:focus:bg-muted",
  ],
});

export const navigationMenuIndicator = tv({
  base: [
    "relative top-px ml-1 size-3 shrink-0 origin-center transition duration-300 [&>svg]:size-3 [&>svg]:shrink-0",
    "group-data-[state=open]/navigation-menu-trigger:rotate-180",
  ],
});

export const navigationMenuContent = tv({
  base: [
    "h-full w-auto p-1 transition-opacity duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] outline-none data-ending-style:opacity-0 data-starting-style:opacity-0",
    "data-instant:transition-none data-[state=closed]:pointer-events-none data-[state=closed]:absolute data-[state=closed]:inset-0",
    "**:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none",
  ],
});

export const navigationMenuLink = tv({
  base: [
    "flex items-center gap-2 rounded-lg p-2 text-sm transition-all outline-none",
    "focus-visible:ring-outline/50 focus-visible:ring-3 focus-visible:outline-1",
    "hover:bg-muted focus:bg-muted data-active:bg-muted/50 data-active:hover:bg-muted data-active:focus:bg-muted",
    "in-data-[slot=navigation-menu-content]:rounded-md [&_svg:not([class*='size-'])]:size-4",
  ],
});

export const navigationMenuPositioner = tv({
  base: [
    "pointer-events-none isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom,transform] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none",
    "data-[side=bottom]:before:top-[-10px] data-[side=bottom]:before:right-0 data-[side=bottom]:before:left-0",
  ],
});

export const navigationMenuPopup = tv({
  base: [
    "data-[ending-style]:easing-[ease] xs:w-(--popup-width) bg-popover text-popover-foreground ring-foreground/10 pointer-events-auto relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden rounded-lg shadow ring-1 outline-none",
    "data-ending-style:scale-90 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-90 data-starting-style:opacity-0",
    "transition-[opacity,transform,width,height,scale,translate] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none",
  ],
});

export const navigationMenuViewport = tv({
  base: "relative size-full overflow-hidden",
});
