import Sidebar from "./Sidebar.vue";
import SidebarContent from "./SidebarContent.vue";
import SidebarFooter from "./SidebarFooter.vue";
import SidebarGroup from "./SidebarGroup.vue";
import SidebarGroupAction from "./SidebarGroupAction.vue";
import SidebarGroupContent from "./SidebarGroupContent.vue";
import SidebarGroupLabel from "./SidebarGroupLabel.vue";
import SidebarHeader from "./SidebarHeader.vue";
import SidebarInput from "./SidebarInput.vue";
import SidebarInset from "./SidebarInset.vue";
import SidebarMenu from "./SidebarMenu.vue";
import SidebarMenuAction from "./SidebarMenuAction.vue";
import SidebarMenuBadge from "./SidebarMenuBadge.vue";
import SidebarMenuButton from "./SidebarMenuButton.vue";
import SidebarMenuItem from "./SidebarMenuItem.vue";
import SidebarMenuSkeleton from "./SidebarMenuSkeleton.vue";
import SidebarMenuSub from "./SidebarMenuSub.vue";
import SidebarMenuSubButton from "./SidebarMenuSubButton.vue";
import SidebarMenuSubItem from "./SidebarMenuSubItem.vue";
import SidebarProvider from "./SidebarProvider.vue";
import SidebarRail from "./SidebarRail.vue";
import SidebarSeparator from "./SidebarSeparator.vue";
import SidebarTrigger from "./SidebarTrigger.vue";
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
} from "./variants";

export type { SidebarProps } from "./Sidebar.vue";
export type { SidebarContentProps } from "./SidebarContent.vue";
export type { SidebarFooterProps } from "./SidebarFooter.vue";
export type { SidebarGroupProps } from "./SidebarGroup.vue";
export type { SidebarGroupActionProps } from "./SidebarGroupAction.vue";
export type { SidebarGroupContentProps } from "./SidebarGroupContent.vue";
export type { SidebarGroupLabelProps } from "./SidebarGroupLabel.vue";
export type { SidebarHeaderProps } from "./SidebarHeader.vue";
export type { SidebarInputProps } from "./SidebarInput.vue";
export type { SidebarInsetProps } from "./SidebarInset.vue";
export type { SidebarMenuProps } from "./SidebarMenu.vue";
export type { SidebarMenuActionProps } from "./SidebarMenuAction.vue";
export type { SidebarMenuBadgeProps } from "./SidebarMenuBadge.vue";
export type { SidebarMenuButtonProps } from "./SidebarMenuButton.vue";
export type { SidebarMenuItemProps } from "./SidebarMenuItem.vue";
export type { SidebarMenuSkeletonProps } from "./SidebarMenuSkeleton.vue";
export type { SidebarMenuSubProps } from "./SidebarMenuSub.vue";
export type { SidebarMenuSubButtonProps } from "./SidebarMenuSubButton.vue";
export type { SidebarMenuSubItemProps } from "./SidebarMenuSubItem.vue";
export type { SidebarProviderProps } from "./SidebarProvider.vue";
export type { SidebarRailProps } from "./SidebarRail.vue";
export type { SidebarSeparatorProps } from "./SidebarSeparator.vue";
export type { SidebarTriggerProps } from "./SidebarTrigger.vue";

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
  Sidebar,
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
