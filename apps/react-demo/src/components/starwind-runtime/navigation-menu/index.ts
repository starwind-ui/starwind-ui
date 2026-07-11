import NavigationMenu from "./NavigationMenu";
import NavigationMenuContent from "./NavigationMenuContent";
import NavigationMenuIndicator from "./NavigationMenuIndicator";
import NavigationMenuItem from "./NavigationMenuItem";
import NavigationMenuLink from "./NavigationMenuLink";
import NavigationMenuList from "./NavigationMenuList";
import NavigationMenuPositioner from "./NavigationMenuPositioner";
import NavigationMenuTrigger from "./NavigationMenuTrigger";
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
