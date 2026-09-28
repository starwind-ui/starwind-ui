import Item from "./Item.svelte";
import ItemActions from "./ItemActions.svelte";
import ItemContent from "./ItemContent.svelte";
import ItemDescription from "./ItemDescription.svelte";
import ItemFooter from "./ItemFooter.svelte";
import ItemGroup from "./ItemGroup.svelte";
import ItemHeader from "./ItemHeader.svelte";
import ItemMedia from "./ItemMedia.svelte";
import ItemSeparator from "./ItemSeparator.svelte";
import ItemTitle from "./ItemTitle.svelte";
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
} from "./variants.js";
export type { ItemProps } from "./Item.svelte";
export type { ItemActionsProps } from "./ItemActions.svelte";
export type { ItemContentProps } from "./ItemContent.svelte";
export type { ItemDescriptionProps } from "./ItemDescription.svelte";
export type { ItemFooterProps } from "./ItemFooter.svelte";
export type { ItemGroupProps } from "./ItemGroup.svelte";
export type { ItemHeaderProps } from "./ItemHeader.svelte";
export type { ItemMediaProps } from "./ItemMedia.svelte";
export type { ItemSeparatorProps } from "./ItemSeparator.svelte";
export type { ItemTitleProps } from "./ItemTitle.svelte";
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
