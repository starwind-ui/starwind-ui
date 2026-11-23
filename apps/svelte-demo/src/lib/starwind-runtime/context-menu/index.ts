import ContextMenu from "./ContextMenu.svelte";
import ContextMenuCheckboxItem from "./ContextMenuCheckboxItem.svelte";
import ContextMenuCheckboxItemIndicator from "./ContextMenuCheckboxItemIndicator.svelte";
import ContextMenuContent from "./ContextMenuContent.svelte";
import ContextMenuGroup from "./ContextMenuGroup.svelte";
import ContextMenuItem from "./ContextMenuItem.svelte";
import ContextMenuLabel from "./ContextMenuLabel.svelte";
import ContextMenuRadioGroup from "./ContextMenuRadioGroup.svelte";
import ContextMenuRadioItem from "./ContextMenuRadioItem.svelte";
import ContextMenuRadioItemIndicator from "./ContextMenuRadioItemIndicator.svelte";
import ContextMenuSeparator from "./ContextMenuSeparator.svelte";
import ContextMenuShortcut from "./ContextMenuShortcut.svelte";
import ContextMenuSub from "./ContextMenuSub.svelte";
import ContextMenuSubContent from "./ContextMenuSubContent.svelte";
import ContextMenuSubTrigger from "./ContextMenuSubTrigger.svelte";
import ContextMenuTrigger from "./ContextMenuTrigger.svelte";
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
} from "./variants.js";

export type { ContextMenuProps } from "./ContextMenu.svelte";
export type { ContextMenuCheckboxItemProps } from "./ContextMenuCheckboxItem.svelte";
export type { ContextMenuCheckboxItemIndicatorProps } from "./ContextMenuCheckboxItemIndicator.svelte";
export type { ContextMenuContentProps } from "./ContextMenuContent.svelte";
export type { ContextMenuGroupProps } from "./ContextMenuGroup.svelte";
export type { ContextMenuItemProps } from "./ContextMenuItem.svelte";
export type { ContextMenuLabelProps } from "./ContextMenuLabel.svelte";
export type { ContextMenuRadioGroupProps } from "./ContextMenuRadioGroup.svelte";
export type { ContextMenuRadioItemProps } from "./ContextMenuRadioItem.svelte";
export type { ContextMenuRadioItemIndicatorProps } from "./ContextMenuRadioItemIndicator.svelte";
export type { ContextMenuSeparatorProps } from "./ContextMenuSeparator.svelte";
export type { ContextMenuShortcutProps } from "./ContextMenuShortcut.svelte";
export type { ContextMenuSubProps } from "./ContextMenuSub.svelte";
export type { ContextMenuSubContentProps } from "./ContextMenuSubContent.svelte";
export type { ContextMenuSubTriggerProps } from "./ContextMenuSubTrigger.svelte";
export type { ContextMenuTriggerProps } from "./ContextMenuTrigger.svelte";

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
const ContextMenuParts = {
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
export default ContextMenuParts;
