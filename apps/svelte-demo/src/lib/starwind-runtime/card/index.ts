import Card from "./Card.svelte";
import CardHeader from "./CardHeader.svelte";
import CardTitle from "./CardTitle.svelte";
import CardDescription from "./CardDescription.svelte";
import CardContent from "./CardContent.svelte";
import CardFooter from "./CardFooter.svelte";
import CardAction from "./CardAction.svelte";
import {
  card,
  cardAction,
  cardContent,
  cardDescription,
  cardFooter,
  cardHeader,
  cardTitle,
} from "./variants.js";
export type { CardProps } from "./Card.svelte";
export type { CardHeaderProps } from "./CardHeader.svelte";
export type { CardTitleProps } from "./CardTitle.svelte";
export type { CardDescriptionProps } from "./CardDescription.svelte";
export type { CardContentProps } from "./CardContent.svelte";
export type { CardFooterProps } from "./CardFooter.svelte";
export type { CardActionProps } from "./CardAction.svelte";
const CardVariants = {
  card,
  cardAction,
  cardContent,
  cardDescription,
  cardFooter,
  cardHeader,
  cardTitle,
};
const CardParts = {
  Root: Card,
  Header: CardHeader,
  Footer: CardFooter,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Action: CardAction,
};
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardVariants,
};
export default CardParts;
