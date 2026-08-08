import Breadcrumb from "./Breadcrumb.vue";
import BreadcrumbEllipsis from "./BreadcrumbEllipsis.vue";
import BreadcrumbItem from "./BreadcrumbItem.vue";
import BreadcrumbLink from "./BreadcrumbLink.vue";
import BreadcrumbList from "./BreadcrumbList.vue";
import BreadcrumbPage from "./BreadcrumbPage.vue";
import BreadcrumbSeparator from "./BreadcrumbSeparator.vue";
import {
  breadcrumbEllipsis,
  breadcrumbItem,
  breadcrumbLink,
  breadcrumbList,
  breadcrumbPage,
  breadcrumbSeparator,
} from "./variants";

export type { BreadcrumbProps } from "./Breadcrumb.vue";
export type { BreadcrumbEllipsisProps } from "./BreadcrumbEllipsis.vue";
export type { BreadcrumbItemProps } from "./BreadcrumbItem.vue";
export type { BreadcrumbLinkProps } from "./BreadcrumbLink.vue";
export type { BreadcrumbListProps } from "./BreadcrumbList.vue";
export type { BreadcrumbPageProps } from "./BreadcrumbPage.vue";
export type { BreadcrumbSeparatorProps } from "./BreadcrumbSeparator.vue";

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
