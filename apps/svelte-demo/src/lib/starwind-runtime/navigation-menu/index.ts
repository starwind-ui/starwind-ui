import NavigationMenu from "./NavigationMenu.svelte";
import NavigationMenuList from "./NavigationMenuList.svelte";
import NavigationMenuItem from "./NavigationMenuItem.svelte";
import NavigationMenuTrigger from "./NavigationMenuTrigger.svelte";
import NavigationMenuIndicator from "./NavigationMenuIndicator.svelte";
import NavigationMenuContent from "./NavigationMenuContent.svelte";
import NavigationMenuLink from "./NavigationMenuLink.svelte";
import NavigationMenuPositioner from "./NavigationMenuPositioner.svelte";
import {
  navigationMenu,
  navigationMenuContent,
  navigationMenuIndicator,
  navigationMenuItem,
  navigationMenuLink,
  navigationMenuList,
  navigationMenuPopup,
  navigationMenuPositioner,
  navigationMenuTrigger,
  navigationMenuViewport,
} from "./variants.js";
export type { NavigationMenuProps } from "./NavigationMenu.svelte";
export type { NavigationMenuListProps } from "./NavigationMenuList.svelte";
export type { NavigationMenuItemProps } from "./NavigationMenuItem.svelte";
export type { NavigationMenuTriggerProps } from "./NavigationMenuTrigger.svelte";
export type { NavigationMenuIndicatorProps } from "./NavigationMenuIndicator.svelte";
export type { NavigationMenuContentProps } from "./NavigationMenuContent.svelte";
export type { NavigationMenuLinkProps } from "./NavigationMenuLink.svelte";
export type { NavigationMenuPositionerProps } from "./NavigationMenuPositioner.svelte";
const navigationMenuTriggerStyle = navigationMenuTrigger;
const NavigationMenuVariants = {
  navigationMenu,
  navigationMenuContent,
  navigationMenuIndicator,
  navigationMenuItem,
  navigationMenuLink,
  navigationMenuList,
  navigationMenuPopup,
  navigationMenuPositioner,
  navigationMenuTrigger,
  navigationMenuViewport,
};
const NavigationMenuParts = {
  Root: NavigationMenu,
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: NavigationMenuTrigger,
  Content: NavigationMenuContent,
  Link: NavigationMenuLink,
  Indicator: NavigationMenuIndicator,
  Positioner: NavigationMenuPositioner,
};
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  NavigationMenuVariants,
  navigationMenuTriggerStyle,
};
export default NavigationMenuParts;
