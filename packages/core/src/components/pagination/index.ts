import Pagination, { pagination } from "./Pagination.astro";
import PaginationContent, { paginationContent } from "./PaginationContent.astro";
import PaginationEllipsis, { paginationEllipsis } from "./PaginationEllipsis.astro";
import PaginationItem, { paginationItem } from "./PaginationItem.astro";
import PaginationLink, { paginationLink } from "./PaginationLink.astro";
import PaginationNext, { paginationNext } from "./PaginationNext.astro";
import PaginationPrevious, { paginationPrevious } from "./PaginationPrevious.astro";

const PaginationVariants = {
  pagination,
  paginationContent,
  paginationEllipsis,
  paginationItem,
  paginationLink,
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
