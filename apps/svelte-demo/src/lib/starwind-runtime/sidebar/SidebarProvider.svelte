<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { sidebar, sidebarContent, sidebarFooter, sidebarGap, sidebarContainer, sidebarGroup, sidebarGroupAction, sidebarGroupContent, sidebarGroupLabel, sidebarHeader, sidebarInner, sidebarInput, sidebarInset, sidebarMenu, sidebarMenuAction, sidebarMenuBadge, sidebarMenuButton, sidebarMenuItem, sidebarMenuSkeleton, sidebarMenuSub, sidebarMenuSubButton, sidebarMenuSubItem, sidebarMobileContent, sidebarProvider, sidebarRail, sidebarSeparator, sidebarTrigger } from "./variants.js";
  import { SidebarProvider } from "@starwind-ui/svelte/sidebar";

  export type SidebarProviderProps = ComponentProps<typeof SidebarProvider> & {children?:Snippet;   };
</script>

<script lang="ts">
  let {
    "defaultOpen": defaultOpen = true,
    "defaultMobileOpen": defaultMobileOpen = false,
    "keyboardShortcut": keyboardShortcut = "b",
    "mobileQuery": mobileQuery = "(max-width: 767.98px)",
    "persistOpen": persistOpen = false,
    "persistenceKey": persistenceKey,
    "persistenceStorage": persistenceStorage,
    "persistenceMaxAge": persistenceMaxAge = 604800,
    "style": style,
    "class": className,
    open = $bindable(),
    mobileOpen = $bindable(),
    "onOpenChange": onOpenChange,
    "onMobileOpenChange": onMobileOpenChange,
    "children": children,
    ...rest
  }: SidebarProviderProps = $props();

  let providerStyle = $derived("--sidebar-width: 18rem; --sidebar-width-icon: 3.5rem; " + (style ?? ""));
</script>

<SidebarProvider
  class={sidebarProvider({ "class": cx(className) })}
  defaultOpen={defaultOpen}
  defaultMobileOpen={defaultMobileOpen}
  onOpenChange={onOpenChange}
  onMobileOpenChange={onMobileOpenChange}
  data-keyboard-shortcut={keyboardShortcut}
  data-mobile-query={mobileQuery}
  keyboardShortcut={keyboardShortcut}
  mobileQuery={mobileQuery}
  persistOpen={persistOpen}
  persistenceKey={persistenceKey}
  persistenceStorage={persistenceStorage}
  persistenceMaxAge={persistenceMaxAge}
  style={providerStyle}
  {...rest}
  data-slot={"sidebar-provider"}
  bind:open={open}
  bind:mobileOpen={mobileOpen}
>
  {@render children?.()}
</SidebarProvider>
