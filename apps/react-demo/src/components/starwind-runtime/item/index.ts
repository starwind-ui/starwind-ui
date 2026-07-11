import Item from "./Item";
import ItemActions from "./ItemActions";
import ItemContent from "./ItemContent";
import ItemDescription from "./ItemDescription";
import ItemFooter from "./ItemFooter";
import ItemGroup from "./ItemGroup";
import ItemHeader from "./ItemHeader";
import ItemMedia from "./ItemMedia";
import ItemSeparator from "./ItemSeparator";
import ItemTitle from "./ItemTitle";
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
