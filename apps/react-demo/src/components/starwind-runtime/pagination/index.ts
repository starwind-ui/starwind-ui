import Pagination from "./Pagination";
import PaginationContent from "./PaginationContent";
import PaginationEllipsis from "./PaginationEllipsis";
import PaginationItem from "./PaginationItem";
import PaginationLink from "./PaginationLink";
import PaginationNext from "./PaginationNext";
import PaginationPrevious from "./PaginationPrevious";
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
