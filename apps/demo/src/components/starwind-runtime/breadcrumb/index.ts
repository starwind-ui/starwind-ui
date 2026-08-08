import Breadcrumb from "./Breadcrumb.astro";
import BreadcrumbEllipsis from "./BreadcrumbEllipsis.astro";
import BreadcrumbItem from "./BreadcrumbItem.astro";
import BreadcrumbLink from "./BreadcrumbLink.astro";
import BreadcrumbList from "./BreadcrumbList.astro";
import BreadcrumbPage from "./BreadcrumbPage.astro";
import BreadcrumbSeparator from "./BreadcrumbSeparator.astro";
import {
  breadcrumbEllipsis,
  breadcrumbItem,
  breadcrumbLink,
  breadcrumbList,
  breadcrumbPage,
  breadcrumbSeparator,
} from "./variants";

const BreadcrumbVariants = {
  breadcrumbEllipsis,
  breadcrumbItem,
  breadcrumbLink,
  breadcrumbList,
  breadcrumbPage,
  breadcrumbSeparator,
};

const BreadcrumbParts = {
  Root: Breadcrumb,
  List: BreadcrumbList,
  Ellipsis: BreadcrumbEllipsis,
  Item: BreadcrumbItem,
  Link: BreadcrumbLink,
  Separator: BreadcrumbSeparator,
  Page: BreadcrumbPage,
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

export default BreadcrumbParts;
