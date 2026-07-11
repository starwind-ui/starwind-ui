import NavigationMenu from "./NavigationMenu.astro";
import NavigationMenuContent from "./NavigationMenuContent.astro";
import NavigationMenuIndicator from "./NavigationMenuIndicator.astro";
import NavigationMenuItem from "./NavigationMenuItem.astro";
import NavigationMenuLink from "./NavigationMenuLink.astro";
import NavigationMenuList from "./NavigationMenuList.astro";
import NavigationMenuPositioner from "./NavigationMenuPositioner.astro";
import NavigationMenuTrigger from "./NavigationMenuTrigger.astro";
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
