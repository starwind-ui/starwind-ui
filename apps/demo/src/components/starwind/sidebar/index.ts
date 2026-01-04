import Sidebar, {
  sidebar,
  sidebarGap,
  sidebarContainer,
  sidebarInner,
  sidebarMobileContent,
} from "./Sidebar.astro";
import SidebarContent, { sidebarContent } from "./SidebarContent.astro";
import SidebarFooter, { sidebarFooter } from "./SidebarFooter.astro";
import SidebarGroup, { sidebarGroup } from "./SidebarGroup.astro";
import SidebarGroupContent, { sidebarGroupContent } from "./SidebarGroupContent.astro";
import SidebarGroupLabel, { sidebarGroupLabel } from "./SidebarGroupLabel.astro";
import SidebarHeader, { sidebarHeader } from "./SidebarHeader.astro";
import SidebarInput from "./SidebarInput.astro";
import SidebarInset, { sidebarInset } from "./SidebarInset.astro";
import SidebarMenu, { sidebarMenu } from "./SidebarMenu.astro";
import SidebarMenuAction, { sidebarMenuAction } from "./SidebarMenuAction.astro";
import SidebarMenuBadge, { sidebarMenuBadge } from "./SidebarMenuBadge.astro";
import SidebarMenuButton, { sidebarMenuButton } from "./SidebarMenuButton.astro";
import SidebarMenuItem, { sidebarMenuItem } from "./SidebarMenuItem.astro";
import SidebarMenuSkeleton from "./SidebarMenuSkeleton.astro";
import SidebarMenuSub, { sidebarMenuSub } from "./SidebarMenuSub.astro";
import SidebarMenuSubButton, { sidebarMenuSubButton } from "./SidebarMenuSubButton.astro";
import SidebarMenuSubItem from "./SidebarMenuSubItem.astro";
import SidebarProvider, { sidebarProvider } from "./SidebarProvider.astro";
import SidebarRail, { sidebarRail } from "./SidebarRail.astro";
import SidebarSeparator from "./SidebarSeparator.astro";
import SidebarTrigger from "./SidebarTrigger.astro";

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
