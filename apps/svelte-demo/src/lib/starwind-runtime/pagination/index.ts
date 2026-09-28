import Pagination from "./Pagination.svelte";
import PaginationContent from "./PaginationContent.svelte";
import PaginationItem from "./PaginationItem.svelte";
import PaginationLink from "./PaginationLink.svelte";
import PaginationPrevious from "./PaginationPrevious.svelte";
import PaginationNext from "./PaginationNext.svelte";
import PaginationEllipsis from "./PaginationEllipsis.svelte";
import { pagination, paginationContent, paginationEllipsis } from "./variants.js";
export type { PaginationProps } from "./Pagination.svelte";
export type { PaginationContentProps } from "./PaginationContent.svelte";
export type { PaginationItemProps } from "./PaginationItem.svelte";
export type { PaginationLinkProps } from "./PaginationLink.svelte";
export type { PaginationPreviousProps } from "./PaginationPrevious.svelte";
export type { PaginationNextProps } from "./PaginationNext.svelte";
export type { PaginationEllipsisProps } from "./PaginationEllipsis.svelte";
const PaginationVariants = { pagination, paginationContent, paginationEllipsis };
const PaginationParts = {
  Root: Pagination,
  Content: PaginationContent,
  Ellipsis: PaginationEllipsis,
  Item: PaginationItem,
  Link: PaginationLink,
  Next: PaginationNext,
  Previous: PaginationPrevious,
};
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationVariants,
};
export default PaginationParts;
