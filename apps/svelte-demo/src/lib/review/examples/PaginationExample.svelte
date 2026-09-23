<script lang="ts">
  import Pagination from "$lib/starwind-runtime/pagination";
  let page = $state(2);
  function select(event: MouseEvent, value: number) {
    event.preventDefault();
    page = value;
  }
</script>

<div class="space-y-6">
  <div>
    <h3 class="mb-3 text-sm font-medium">Result pages</h3>
    <Pagination.Root aria-label="Result pages"
      ><Pagination.Content class="flex-wrap">
        <Pagination.Item
          ><Pagination.Previous
            href="#pagination-review"
            size="icon-sm"
            aria-label="Go to previous page"
            disabled={page === 1}
            onclick={(event) => select(event, Math.max(1, page - 1))}
            ><span class="sr-only">Previous</span></Pagination.Previous
          ></Pagination.Item
        >
        {#each [1, 2, 3] as value (value)}<Pagination.Item
            ><Pagination.Link
              href="#pagination-review"
              size="icon-sm"
              isActive={page === value}
              aria-label={`Page ${value}`}
              onclick={(event) => select(event, value)}>{value}</Pagination.Link
            ></Pagination.Item
          >{/each}
        <Pagination.Item><Pagination.Ellipsis size="icon-sm" /></Pagination.Item>
        <Pagination.Item
          ><Pagination.Next
            href="#pagination-review"
            size="icon-sm"
            disabled={page === 8}
            onclick={(event) => select(event, Math.min(8, page + 1))}
            ><span class="sr-only">Next</span></Pagination.Next
          ></Pagination.Item
        >
      </Pagination.Content></Pagination.Root
    >
    <p class="mt-3 text-center text-sm text-muted-foreground" aria-live="polite">
      Page {page} of 8
    </p>
  </div>
  <div>
    <h3 class="mb-3 text-sm font-medium">Custom icon content</h3>
    <Pagination.Root aria-label="Document pages"
      ><Pagination.Content class="flex-wrap">
        <Pagination.Item
          ><Pagination.Previous href="#pagination-review" size="sm"
            >{#snippet icon()}<span aria-hidden="true">←</span>{/snippet}Back</Pagination.Previous
          ></Pagination.Item
        >
        <Pagination.Item
          ><Pagination.Ellipsis size="icon-sm"
            >{#snippet icon()}<span aria-hidden="true">···</span>{/snippet}<span class="sr-only"
              >More documents</span
            ></Pagination.Ellipsis
          ></Pagination.Item
        >
        <Pagination.Item
          ><Pagination.Next href="#pagination-review" size="sm"
            >{#snippet icon()}<span aria-hidden="true">→</span>{/snippet}Next</Pagination.Next
          ></Pagination.Item
        >
      </Pagination.Content></Pagination.Root
    >
  </div>
</div>
