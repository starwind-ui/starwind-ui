import Card, { card } from "./Card.astro";
import CardAction, { cardAction } from "./CardAction.astro";
import CardContent, { cardContent } from "./CardContent.astro";
import CardDescription, { cardDescription } from "./CardDescription.astro";
import CardFooter, { cardFooter } from "./CardFooter.astro";
import CardHeader, { cardHeader } from "./CardHeader.astro";
import CardTitle, { cardTitle } from "./CardTitle.astro";

const CardVariants = {
  card,
  cardAction,
  cardContent,
  cardDescription,
  cardFooter,
  cardHeader,
  cardTitle,
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

export default {
  Root: Card,
  Header: CardHeader,
  Footer: CardFooter,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Action: CardAction,
};
