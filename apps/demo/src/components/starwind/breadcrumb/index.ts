import Breadcrumb from "./Breadcrumb.astro";
import BreadcrumbEllipsis, { breadcrumbEllipsis } from "./BreadcrumbEllipsis.astro";
import BreadcrumbItem, { breadcrumbItem } from "./BreadcrumbItem.astro";
import BreadcrumbLink, { breadcrumbLink } from "./BreadcrumbLink.astro";
import BreadcrumbList, { breadcrumbList } from "./BreadcrumbList.astro";
import BreadcrumbPage, { breadcrumbPage } from "./BreadcrumbPage.astro";
import BreadcrumbSeparator, { breadcrumbSeparator } from "./BreadcrumbSeparator.astro";

const BreadcrumbVariants = {
  breadcrumbEllipsis,
  breadcrumbItem,
  breadcrumbLink,
  breadcrumbList,
  breadcrumbPage,
  breadcrumbSeparator,
};

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbVariants,
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
