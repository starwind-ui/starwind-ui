import SidebarProvider from "./SidebarProvider.svelte";
import Sidebar from "./Sidebar.svelte";
import SidebarTrigger from "./SidebarTrigger.svelte";
import SidebarRail from "./SidebarRail.svelte";
import SidebarInset from "./SidebarInset.svelte";
import SidebarContent from "./SidebarContent.svelte";
import SidebarHeader from "./SidebarHeader.svelte";
import SidebarFooter from "./SidebarFooter.svelte";
import SidebarGroup from "./SidebarGroup.svelte";
import SidebarGroupLabel from "./SidebarGroupLabel.svelte";
import SidebarGroupAction from "./SidebarGroupAction.svelte";
import SidebarGroupContent from "./SidebarGroupContent.svelte";
import SidebarInput from "./SidebarInput.svelte";
import SidebarSeparator from "./SidebarSeparator.svelte";
import SidebarMenu from "./SidebarMenu.svelte";
import SidebarMenuItem from "./SidebarMenuItem.svelte";
import SidebarMenuButton from "./SidebarMenuButton.svelte";
import SidebarMenuAction from "./SidebarMenuAction.svelte";
import SidebarMenuBadge from "./SidebarMenuBadge.svelte";
import SidebarMenuSkeleton from "./SidebarMenuSkeleton.svelte";
import SidebarMenuSub from "./SidebarMenuSub.svelte";
import SidebarMenuSubItem from "./SidebarMenuSubItem.svelte";
import SidebarMenuSubButton from "./SidebarMenuSubButton.svelte";
import {
  sidebar,
  sidebarContainer,
  sidebarContent,
  sidebarFooter,
  sidebarGap,
  sidebarGroup,
  sidebarGroupAction,
  sidebarGroupContent,
  sidebarGroupLabel,
  sidebarHeader,
  sidebarInner,
  sidebarInput,
  sidebarInset,
  sidebarMenu,
  sidebarMenuAction,
  sidebarMenuBadge,
  sidebarMenuButton,
  sidebarMenuItem,
  sidebarMenuSkeleton,
  sidebarMenuSub,
  sidebarMenuSubButton,
  sidebarMenuSubItem,
  sidebarMobileContent,
  sidebarProvider,
  sidebarRail,
  sidebarSeparator,
  sidebarTrigger,
} from "./variants.js";
export type { SidebarProviderProps } from "./SidebarProvider.svelte";
export type { SidebarProps } from "./Sidebar.svelte";
export type { SidebarTriggerProps } from "./SidebarTrigger.svelte";
export type { SidebarRailProps } from "./SidebarRail.svelte";
export type { SidebarInsetProps } from "./SidebarInset.svelte";
export type { SidebarContentProps } from "./SidebarContent.svelte";
export type { SidebarHeaderProps } from "./SidebarHeader.svelte";
export type { SidebarFooterProps } from "./SidebarFooter.svelte";
export type { SidebarGroupProps } from "./SidebarGroup.svelte";
export type { SidebarGroupLabelProps } from "./SidebarGroupLabel.svelte";
export type { SidebarGroupActionProps } from "./SidebarGroupAction.svelte";
export type { SidebarGroupContentProps } from "./SidebarGroupContent.svelte";
export type { SidebarInputProps } from "./SidebarInput.svelte";
export type { SidebarSeparatorProps } from "./SidebarSeparator.svelte";
export type { SidebarMenuProps } from "./SidebarMenu.svelte";
export type { SidebarMenuItemProps } from "./SidebarMenuItem.svelte";
export type { SidebarMenuButtonProps } from "./SidebarMenuButton.svelte";
export type { SidebarMenuActionProps } from "./SidebarMenuAction.svelte";
export type { SidebarMenuBadgeProps } from "./SidebarMenuBadge.svelte";
export type { SidebarMenuSkeletonProps } from "./SidebarMenuSkeleton.svelte";
export type { SidebarMenuSubProps } from "./SidebarMenuSub.svelte";
export type { SidebarMenuSubItemProps } from "./SidebarMenuSubItem.svelte";
export type { SidebarMenuSubButtonProps } from "./SidebarMenuSubButton.svelte";
const SidebarVariants = {
  sidebar,
  sidebarContainer,
  sidebarContent,
  sidebarFooter,
  sidebarGap,
  sidebarGroup,
  sidebarGroupAction,
  sidebarGroupContent,
  sidebarGroupLabel,
  sidebarHeader,
  sidebarInner,
  sidebarInput,
  sidebarInset,
  sidebarMenu,
  sidebarMenuAction,
  sidebarMenuBadge,
  sidebarMenuButton,
  sidebarMenuItem,
  sidebarMenuSkeleton,
  sidebarMenuSub,
  sidebarMenuSubButton,
  sidebarMenuSubItem,
  sidebarMobileContent,
  sidebarProvider,
  sidebarRail,
  sidebarSeparator,
  sidebarTrigger,
};
const SidebarParts = {
  Root: SidebarProvider,
  Sidebar: Sidebar,
  Content: SidebarContent,
  Footer: SidebarFooter,
  Group: SidebarGroup,
  GroupAction: SidebarGroupAction,
  GroupContent: SidebarGroupContent,
  GroupLabel: SidebarGroupLabel,
  Header: SidebarHeader,
  Input: SidebarInput,
  Inset: SidebarInset,
  Menu: SidebarMenu,
  MenuAction: SidebarMenuAction,
  MenuBadge: SidebarMenuBadge,
  MenuButton: SidebarMenuButton,
  MenuItem: SidebarMenuItem,
  MenuSkeleton: SidebarMenuSkeleton,
  MenuSub: SidebarMenuSub,
  MenuSubButton: SidebarMenuSubButton,
  MenuSubItem: SidebarMenuSubItem,
  Rail: SidebarRail,
  Separator: SidebarSeparator,
  Trigger: SidebarTrigger,
};
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SidebarVariants,
};
export default SidebarParts;
