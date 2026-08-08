import Card from "./Card.vue";
import CardAction from "./CardAction.vue";
import CardContent from "./CardContent.vue";
import CardDescription from "./CardDescription.vue";
import CardFooter from "./CardFooter.vue";
import CardHeader from "./CardHeader.vue";
import CardTitle from "./CardTitle.vue";
import {
  card,
  cardAction,
  cardContent,
  cardDescription,
  cardFooter,
  cardHeader,
  cardTitle,
} from "./variants";

export type { CardProps } from "./Card.vue";
export type { CardActionProps } from "./CardAction.vue";
export type { CardContentProps } from "./CardContent.vue";
export type { CardDescriptionProps } from "./CardDescription.vue";
export type { CardFooterProps } from "./CardFooter.vue";
export type { CardHeaderProps } from "./CardHeader.vue";
export type { CardTitleProps } from "./CardTitle.vue";

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
