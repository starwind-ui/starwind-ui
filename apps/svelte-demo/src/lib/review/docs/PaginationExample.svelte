<script lang="ts">
  import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from "$lib/starwind-runtime/pagination";
</script>

<div>
  <Pagination>
    <PaginationContent class="flex-wrap justify-center">
      <PaginationItem>
        <PaginationPrevious href="#pagination-review">Prev</PaginationPrevious>
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#pagination-review">1</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#pagination-review" isActive>2</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#pagination-review">3</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationEllipsis />
      </PaginationItem>
      <PaginationItem>
        <PaginationNext href="#pagination-review">Next</PaginationNext>
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</div>
