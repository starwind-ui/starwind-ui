import Breadcrumb from "./Breadcrumb.astro";
import BreadcrumbEllipsis from "./BreadcrumbEllipsis.astro";
import BreadcrumbItem from "./BreadcrumbItem.astro";
import BreadcrumbLink from "./BreadcrumbLink.astro";
import BreadcrumbList from "./BreadcrumbList.astro";
import BreadcrumbPage from "./BreadcrumbPage.astro";
import BreadcrumbSeparator from "./BreadcrumbSeparator.astro";

export {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbSeparator,
	BreadcrumbPage,
};

export default {
	Root: Breadcrumb,
	List: BreadcrumbList,
	Ellipsis: BreadcrumbEllipsis,
	Item: BreadcrumbItem,
	Link: BreadcrumbLink,
	Separator: BreadcrumbSeparator,
	Page: BreadcrumbPage,
};
