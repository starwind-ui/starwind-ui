import Pagination from "./Pagination.astro";
import PaginationContent from "./PaginationContent.astro";
import PaginationEllipsis from "./PaginationEllipsis.astro";
import PaginationItem from "./PaginationItem.astro";
import PaginationLink from "./PaginationLink.astro";
import PaginationNext from "./PaginationNext.astro";
import PaginationPrevious from "./PaginationPrevious.astro";
import {
  pagination,
  paginationContent,
  paginationEllipsis,
  paginationNext,
  paginationPrevious,
} from "./variants";
const PaginationVariants = {
  pagination,
  paginationContent,
  paginationEllipsis,
  paginationNext,
  paginationPrevious,
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

export default {
  Root: Pagination,
  Content: PaginationContent,
  Ellipsis: PaginationEllipsis,
  Item: PaginationItem,
  Link: PaginationLink,
  Next: PaginationNext,
  Previous: PaginationPrevious,
};
