import Card from "./Card.astro";
import CardContent from "./CardContent.astro";
import CardDescription from "./CardDescription.astro";
import CardFooter from "./CardFooter.astro";
import CardHeader from "./CardHeader.astro";
import CardTitle from "./CardTitle.astro";
import { tv } from "tailwind-variants";

const cardVariant = tv({ base: "bg-card text-card-foreground rounded-2xl border shadow-sm" });
const cardContentVariant = tv({ base: "p-8 pt-0" });
const cardDescriptionVariant = tv({ base: "text-muted-foreground text-base" });
const cardFooterVariant = tv({ base: "flex items-center p-8 pt-0" });
const cardHeaderVariant = tv({ base: "flex flex-col space-y-2 p-8" });
const cardTitleVariant = tv({ base: "text-3xl leading-none font-semibold tracking-tight" });


export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariant, cardContentVariant, cardDescriptionVariant, cardFooterVariant, cardHeaderVariant, cardTitleVariant };

export default {
  Root: Card,
  Header: CardHeader,
  Footer: CardFooter,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
};
