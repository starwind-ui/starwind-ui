import {
  DropdownCheckboxItem as ContextMenuCheckboxItem,
  DropdownContent as ContextMenuContent,
  DropdownGroup as ContextMenuGroup,
  DropdownItem as ContextMenuItem,
  DropdownLabel as ContextMenuLabel,
  DropdownSeparator as ContextMenuSeparator,
  DropdownShortcut as ContextMenuShortcut,
  DropdownSub as ContextMenuSub,
  DropdownSubContent as ContextMenuSubContent,
  DropdownSubTrigger as ContextMenuSubTrigger,
} from "@/components/starwind/dropdown";

import ContextMenu from "./ContextMenu.astro";
import ContextMenuTrigger from "./ContextMenuTrigger.astro";

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};

export default {
  Root: ContextMenu,
  Trigger: ContextMenuTrigger,
  Content: ContextMenuContent,
  Item: ContextMenuItem,
  CheckboxItem: ContextMenuCheckboxItem,
  Label: ContextMenuLabel,
  Separator: ContextMenuSeparator,
  Shortcut: ContextMenuShortcut,
  Group: ContextMenuGroup,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};
