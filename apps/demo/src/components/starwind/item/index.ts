import Item, { item } from "./Item.astro";
import ItemActions, { itemActions } from "./ItemActions.astro";
import ItemContent, { itemContent } from "./ItemContent.astro";
import ItemDescription, { itemDescription } from "./ItemDescription.astro";
import ItemFooter, { itemFooter } from "./ItemFooter.astro";
import ItemGroup, { itemGroup } from "./ItemGroup.astro";
import ItemHeader, { itemHeader } from "./ItemHeader.astro";
import ItemMedia, { itemMedia } from "./ItemMedia.astro";
import ItemSeparator, { itemSeparator } from "./ItemSeparator.astro";
import ItemTitle, { itemTitle } from "./ItemTitle.astro";

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

export default {
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
