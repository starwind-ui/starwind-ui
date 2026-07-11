import ContextMenu from "./ContextMenu";
import ContextMenuCheckboxItem from "./ContextMenuCheckboxItem";
import ContextMenuCheckboxItemIndicator from "./ContextMenuCheckboxItemIndicator";
import ContextMenuContent from "./ContextMenuContent";
import ContextMenuGroup from "./ContextMenuGroup";
import ContextMenuItem from "./ContextMenuItem";
import ContextMenuLabel from "./ContextMenuLabel";
import ContextMenuRadioGroup from "./ContextMenuRadioGroup";
import ContextMenuRadioItem from "./ContextMenuRadioItem";
import ContextMenuRadioItemIndicator from "./ContextMenuRadioItemIndicator";
import ContextMenuSeparator from "./ContextMenuSeparator";
import ContextMenuShortcut from "./ContextMenuShortcut";
import ContextMenuSub from "./ContextMenuSub";
import ContextMenuSubContent from "./ContextMenuSubContent";
import ContextMenuSubTrigger from "./ContextMenuSubTrigger";
import ContextMenuTrigger from "./ContextMenuTrigger";
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
