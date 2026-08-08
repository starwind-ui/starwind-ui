import Item from "./Item.vue";
import ItemActions from "./ItemActions.vue";
import ItemContent from "./ItemContent.vue";
import ItemDescription from "./ItemDescription.vue";
import ItemFooter from "./ItemFooter.vue";
import ItemGroup from "./ItemGroup.vue";
import ItemHeader from "./ItemHeader.vue";
import ItemMedia from "./ItemMedia.vue";
import ItemSeparator from "./ItemSeparator.vue";
import ItemTitle from "./ItemTitle.vue";
import {
  item,
  itemActions,
  itemContent,
  itemDescription,
  itemFooter,
  itemGroup,
  itemHeader,
  itemMedia,
  itemSeparator,
  itemTitle,
} from "./variants";

export type { ItemProps } from "./Item.vue";
export type { ItemActionsProps } from "./ItemActions.vue";
export type { ItemContentProps } from "./ItemContent.vue";
export type { ItemDescriptionProps } from "./ItemDescription.vue";
export type { ItemFooterProps } from "./ItemFooter.vue";
export type { ItemGroupProps } from "./ItemGroup.vue";
export type { ItemHeaderProps } from "./ItemHeader.vue";
export type { ItemMediaProps } from "./ItemMedia.vue";
export type { ItemSeparatorProps } from "./ItemSeparator.vue";
export type { ItemTitleProps } from "./ItemTitle.vue";

const ItemVariants = {
  item,
  itemActions,
  itemContent,
  itemDescription,
  itemFooter,
  itemGroup,
  itemHeader,
  itemMedia,
  itemSeparator,
  itemTitle,
};

const ItemParts = {
  Root: Item,
  Actions: ItemActions,
  Content: ItemContent,
  Description: ItemDescription,
  Footer: ItemFooter,
  Group: ItemGroup,
  Header: ItemHeader,
  Media: ItemMedia,
  Separator: ItemSeparator,
  Title: ItemTitle,
};

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  ItemVariants,
};

export default ItemParts;
