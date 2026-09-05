import Pagination from "./Pagination.vue";
import PaginationContent from "./PaginationContent.vue";
import PaginationEllipsis from "./PaginationEllipsis.vue";
import PaginationItem from "./PaginationItem.vue";
import PaginationLink from "./PaginationLink.vue";
import PaginationNext from "./PaginationNext.vue";
import PaginationPrevious from "./PaginationPrevious.vue";
import { pagination, paginationContent, paginationEllipsis } from "./variants";

export type { PaginationProps } from "./Pagination.vue";
export type { PaginationContentProps } from "./PaginationContent.vue";
export type { PaginationEllipsisProps } from "./PaginationEllipsis.vue";
export type { PaginationItemProps } from "./PaginationItem.vue";
export type { PaginationLinkProps } from "./PaginationLink.vue";
export type { PaginationNextProps } from "./PaginationNext.vue";
export type { PaginationPreviousProps } from "./PaginationPrevious.vue";

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
