import Sidebar from "./Sidebar.astro";
import SidebarContent from "./SidebarContent.astro";
import SidebarFooter from "./SidebarFooter.astro";
import SidebarGroup from "./SidebarGroup.astro";
import SidebarGroupContent from "./SidebarGroupContent.astro";
import SidebarGroupLabel from "./SidebarGroupLabel.astro";
import SidebarHeader from "./SidebarHeader.astro";
import SidebarInput from "./SidebarInput.astro";
import SidebarInset from "./SidebarInset.astro";
import SidebarMenu from "./SidebarMenu.astro";
import SidebarMenuAction from "./SidebarMenuAction.astro";
import SidebarMenuBadge from "./SidebarMenuBadge.astro";
import SidebarMenuButton from "./SidebarMenuButton.astro";
import SidebarMenuItem from "./SidebarMenuItem.astro";
import SidebarMenuSkeleton from "./SidebarMenuSkeleton.astro";
import SidebarMenuSub from "./SidebarMenuSub.astro";
import SidebarMenuSubButton from "./SidebarMenuSubButton.astro";
import SidebarMenuSubItem from "./SidebarMenuSubItem.astro";
import SidebarProvider from "./SidebarProvider.astro";
import SidebarRail from "./SidebarRail.astro";
import SidebarSeparator from "./SidebarSeparator.astro";
import SidebarTrigger from "./SidebarTrigger.astro";
import {
  sidebar,
  sidebarContainer,
  sidebarContent,
  sidebarFooter,
  sidebarGap,
  sidebarGroup,
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
  sidebarMobileContent,
  sidebarProvider,
  sidebarRail,
  sidebarSeparator,
} from "./variants";

const SidebarVariants = {
  sidebar,
  sidebarGap,
  sidebarContainer,
  sidebarInner,
  sidebarMobileContent,
  sidebarContent,
  sidebarFooter,
  sidebarGroup,
  sidebarGroupContent,
  sidebarGroupLabel,
  sidebarHeader,
  sidebarInset,
  sidebarMenu,
  sidebarMenuAction,
  sidebarMenuBadge,
  sidebarMenuButton,
  sidebarMenuItem,
  sidebarMenuSub,
  sidebarMenuSubButton,
  sidebarProvider,
  sidebarRail,
  sidebarMenuSkeleton,
  sidebarInput,
  sidebarSeparator,
};

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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

export default {
  Root: SidebarProvider,
  Sidebar,
  Content: SidebarContent,
  Footer: SidebarFooter,
  Group: SidebarGroup,
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
