import Breadcrumb from "./Breadcrumb.svelte";
import BreadcrumbList from "./BreadcrumbList.svelte";
import BreadcrumbItem from "./BreadcrumbItem.svelte";
import BreadcrumbLink from "./BreadcrumbLink.svelte";
import BreadcrumbPage from "./BreadcrumbPage.svelte";
import BreadcrumbSeparator from "./BreadcrumbSeparator.svelte";
import BreadcrumbEllipsis from "./BreadcrumbEllipsis.svelte";
import {
  breadcrumbEllipsis,
  breadcrumbItem,
  breadcrumbLink,
  breadcrumbList,
  breadcrumbPage,
  breadcrumbSeparator,
} from "./variants.js";
export type { BreadcrumbProps } from "./Breadcrumb.svelte";
export type { BreadcrumbListProps } from "./BreadcrumbList.svelte";
export type { BreadcrumbItemProps } from "./BreadcrumbItem.svelte";
export type { BreadcrumbLinkProps } from "./BreadcrumbLink.svelte";
export type { BreadcrumbPageProps } from "./BreadcrumbPage.svelte";
export type { BreadcrumbSeparatorProps } from "./BreadcrumbSeparator.svelte";
export type { BreadcrumbEllipsisProps } from "./BreadcrumbEllipsis.svelte";
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
