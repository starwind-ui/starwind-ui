import ContextMenu from "./ContextMenu.astro";
import ContextMenuCheckboxItem from "./ContextMenuCheckboxItem.astro";
import ContextMenuCheckboxItemIndicator from "./ContextMenuCheckboxItemIndicator.astro";
import ContextMenuContent from "./ContextMenuContent.astro";
import ContextMenuGroup from "./ContextMenuGroup.astro";
import ContextMenuItem from "./ContextMenuItem.astro";
import ContextMenuLabel from "./ContextMenuLabel.astro";
import ContextMenuRadioGroup from "./ContextMenuRadioGroup.astro";
import ContextMenuRadioItem from "./ContextMenuRadioItem.astro";
import ContextMenuRadioItemIndicator from "./ContextMenuRadioItemIndicator.astro";
import ContextMenuSeparator from "./ContextMenuSeparator.astro";
import ContextMenuShortcut from "./ContextMenuShortcut.astro";
import ContextMenuSub from "./ContextMenuSub.astro";
import ContextMenuSubContent from "./ContextMenuSubContent.astro";
import ContextMenuSubTrigger from "./ContextMenuSubTrigger.astro";
import ContextMenuTrigger from "./ContextMenuTrigger.astro";
import {
  contextMenu,
  contextMenuCheckboxItem,
  contextMenuCheckboxItemIndicator,
  contextMenuContent,
  contextMenuItem,
  contextMenuLabel,
  contextMenuRadioGroup,
  contextMenuRadioItem,
  contextMenuRadioItemIndicator,
  contextMenuSeparator,
  contextMenuShortcut,
  contextMenuTrigger,
} from "./variants";

const ContextMenuVariants = {
  contextMenu,
  contextMenuCheckboxItem,
  contextMenuCheckboxItemIndicator,
  contextMenuContent,
  contextMenuItem,
  contextMenuLabel,
  contextMenuRadioGroup,
  contextMenuRadioItem,
  contextMenuRadioItemIndicator,
  contextMenuSeparator,
  contextMenuShortcut,
  contextMenuTrigger,
};

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuCheckboxItemIndicator,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRadioItemIndicator,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuVariants,
};

export default {
  Root: ContextMenu,
  Trigger: ContextMenuTrigger,
  Content: ContextMenuContent,
  CheckboxItem: ContextMenuCheckboxItem,
  CheckboxItemIndicator: ContextMenuCheckboxItemIndicator,
  RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem,
  RadioItemIndicator: ContextMenuRadioItemIndicator,
  Item: ContextMenuItem,
  Group: ContextMenuGroup,
  Label: ContextMenuLabel,
  Separator: ContextMenuSeparator,
  Shortcut: ContextMenuShortcut,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};
