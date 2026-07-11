import Breadcrumb from "./Breadcrumb";
import BreadcrumbEllipsis from "./BreadcrumbEllipsis";
import BreadcrumbItem from "./BreadcrumbItem";
import BreadcrumbLink from "./BreadcrumbLink";
import BreadcrumbList from "./BreadcrumbList";
import BreadcrumbPage from "./BreadcrumbPage";
import BreadcrumbSeparator from "./BreadcrumbSeparator";
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
