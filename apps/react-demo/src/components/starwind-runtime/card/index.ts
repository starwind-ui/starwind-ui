import Card from "./Card";
import CardAction from "./CardAction";
import CardContent from "./CardContent";
import CardDescription from "./CardDescription";
import CardFooter from "./CardFooter";
import CardHeader from "./CardHeader";
import CardTitle from "./CardTitle";
import {
  card,
  cardAction,
  cardContent,
  cardDescription,
  cardFooter,
  cardHeader,
  cardTitle,
} from "./variants";

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
