<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { SidebarComponent } from "@starwind-ui/svelte/sidebar";
  import type { SvelteHTMLElements } from "svelte/elements";
  import { Sheet } from "../sheet/index.js";
  import { SheetContent } from "../sheet/index.js";
  import { SheetHeader } from "../sheet/index.js";
  import { SheetTitle } from "../sheet/index.js";
  import { SheetDescription } from "../sheet/index.js";

  export type SidebarProps = Omit<ComponentProps<typeof SidebarComponent>, "collapsible" | "ref"> & {children?:Snippet; "side"?:"left" | "right"; "variant"?:"sidebar" | "floating" | "inset"; "collapsible"?:"offcanvas" | "icon" | "none";  ref?:HTMLDivElement;};
</script>

<script lang="ts">
  let {
    "side": side = "left",
    "variant": variant = "sidebar",
    "collapsible": collapsible = "offcanvas",
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: SidebarProps = $props();

  let mobileStyle = $derived("--sidebar-width: 18rem");
</script>

{#if collapsible === "none"}
  <div
    class={["bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col", className].filter(Boolean).join(" ")}
    {...rest}
    data-slot={"sidebar"}
    bind:this={ref}
  >
    {@render children?.()}
  </div>
{:else}
  <SidebarComponent
    class={sidebar({ "class": cx(className) })}
    data-collapsible-mode={collapsible}
    collapsible={collapsible}
    data-variant={variant}
    variant={variant}
    data-side={side}
    side={side}
    data-slot={"sidebar"}
  >
    <div
      data-slot={"sidebar-gap"}
      class={sidebarGap({ "variant": variant })}
    >

    </div>
    <div
      class={sidebarContainer({ "side": side, "variant": variant })}
      {...rest}
      data-slot={"sidebar-container"}
      bind:this={ref}
    >
      <div
        data-sidebar={"sidebar"}
        data-slot={"sidebar-inner"}
        class={sidebarInner({ "variant": variant })}
      >
        {@render children?.()}
      </div>
    </div>
  </SidebarComponent>
  <Sheet
    class={"md:hidden"}
    data-sidebar={"mobile"}
    data-slot={"sidebar-mobile"}
  >
    <SheetContent
      side={side}
      class={sidebarMobileContent({  })}
      style={mobileStyle}
      data-sidebar={"sidebar"}
      data-slot={"sidebar-mobile-content"}
    >
      <SheetHeader
        class={"sr-only"}
      >
        <SheetTitle>
          Sidebar
        </SheetTitle>
        <SheetDescription>
          Mobile navigation sidebar
        </SheetDescription>
      </SheetHeader>
      <div
        class={"flex h-full w-full flex-col"}
      >
        {@render children?.()}
      </div>
    </SheetContent>
  </Sheet>
{/if}
