import NavigationMenu from "./NavigationMenu.vue";
import NavigationMenuContent from "./NavigationMenuContent.vue";
import NavigationMenuIndicator from "./NavigationMenuIndicator.vue";
import NavigationMenuItem from "./NavigationMenuItem.vue";
import NavigationMenuLink from "./NavigationMenuLink.vue";
import NavigationMenuList from "./NavigationMenuList.vue";
import NavigationMenuPositioner from "./NavigationMenuPositioner.vue";
import NavigationMenuTrigger from "./NavigationMenuTrigger.vue";
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
} from "./variants";

export type { NavigationMenuProps } from "./NavigationMenu.vue";
export type { NavigationMenuContentProps } from "./NavigationMenuContent.vue";
export type { NavigationMenuIndicatorProps } from "./NavigationMenuIndicator.vue";
export type { NavigationMenuItemProps } from "./NavigationMenuItem.vue";
export type { NavigationMenuLinkProps } from "./NavigationMenuLink.vue";
export type { NavigationMenuListProps } from "./NavigationMenuList.vue";
export type { NavigationMenuPositionerProps } from "./NavigationMenuPositioner.vue";
export type { NavigationMenuTriggerProps } from "./NavigationMenuTrigger.vue";

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

export default {
  Root: NavigationMenu,
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: NavigationMenuTrigger,
  Content: NavigationMenuContent,
  Link: NavigationMenuLink,
  Indicator: NavigationMenuIndicator,
  Positioner: NavigationMenuPositioner,
};
