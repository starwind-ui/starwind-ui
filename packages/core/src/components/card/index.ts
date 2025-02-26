import Card from "./Card.astro";
import CardContent from "./CardContent.astro";
import CardDescription from "./CardDescription.astro";
import CardFooter from "./CardFooter.astro";
import CardHeader from "./CardHeader.astro";
import CardTitle from "./CardTitle.astro";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

export default {
	Root: Card,
	Header: CardHeader,
	Footer: CardFooter,
	Title: CardTitle,
	Description: CardDescription,
	Content: CardContent,
};
