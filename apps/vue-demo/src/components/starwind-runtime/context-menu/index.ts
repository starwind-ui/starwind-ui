import ContextMenu from "./ContextMenu.vue";
import ContextMenuCheckboxItem from "./ContextMenuCheckboxItem.vue";
import ContextMenuCheckboxItemIndicator from "./ContextMenuCheckboxItemIndicator.vue";
import ContextMenuContent from "./ContextMenuContent.vue";
import ContextMenuGroup from "./ContextMenuGroup.vue";
import ContextMenuItem from "./ContextMenuItem.vue";
import ContextMenuLabel from "./ContextMenuLabel.vue";
import ContextMenuRadioGroup from "./ContextMenuRadioGroup.vue";
import ContextMenuRadioItem from "./ContextMenuRadioItem.vue";
import ContextMenuRadioItemIndicator from "./ContextMenuRadioItemIndicator.vue";
import ContextMenuSeparator from "./ContextMenuSeparator.vue";
import ContextMenuShortcut from "./ContextMenuShortcut.vue";
import ContextMenuSub from "./ContextMenuSub.vue";
import ContextMenuSubContent from "./ContextMenuSubContent.vue";
import ContextMenuSubTrigger from "./ContextMenuSubTrigger.vue";
import ContextMenuTrigger from "./ContextMenuTrigger.vue";
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

export type { ContextMenuProps } from "./ContextMenu.vue";
export type { ContextMenuCheckboxItemProps } from "./ContextMenuCheckboxItem.vue";
export type { ContextMenuCheckboxItemIndicatorProps } from "./ContextMenuCheckboxItemIndicator.vue";
export type { ContextMenuContentProps } from "./ContextMenuContent.vue";
export type { ContextMenuGroupProps } from "./ContextMenuGroup.vue";
export type { ContextMenuItemProps } from "./ContextMenuItem.vue";
export type { ContextMenuLabelProps } from "./ContextMenuLabel.vue";
export type { ContextMenuRadioGroupProps } from "./ContextMenuRadioGroup.vue";
export type { ContextMenuRadioItemProps } from "./ContextMenuRadioItem.vue";
export type { ContextMenuRadioItemIndicatorProps } from "./ContextMenuRadioItemIndicator.vue";
export type { ContextMenuSeparatorProps } from "./ContextMenuSeparator.vue";
export type { ContextMenuShortcutProps } from "./ContextMenuShortcut.vue";
export type { ContextMenuSubProps } from "./ContextMenuSub.vue";
export type { ContextMenuSubContentProps } from "./ContextMenuSubContent.vue";
export type { ContextMenuSubTriggerProps } from "./ContextMenuSubTrigger.vue";
export type { ContextMenuTriggerProps } from "./ContextMenuTrigger.vue";

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
