import Item from "./Item.astro";
import ItemActions from "./ItemActions.astro";
import ItemContent from "./ItemContent.astro";
import ItemDescription from "./ItemDescription.astro";
import ItemFooter from "./ItemFooter.astro";
import ItemGroup from "./ItemGroup.astro";
import ItemHeader from "./ItemHeader.astro";
import ItemMedia from "./ItemMedia.astro";
import ItemSeparator from "./ItemSeparator.astro";
import ItemTitle from "./ItemTitle.astro";
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
