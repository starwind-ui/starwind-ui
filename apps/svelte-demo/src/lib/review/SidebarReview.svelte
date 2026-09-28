<script lang="ts">
  import SidebarDocsExample from "./docs/SidebarDocsExample.svelte";
  import source from "./docs/SidebarDocsExample.svelte?raw";
  import contentSource from "./examples/SidebarExample.svelte?raw";
</script>

<section data-styled-review="sidebar" id="sidebar-review" aria-label="Sidebar">
  <div data-docs-example="sidebar">
    <div data-docs-preview><SidebarDocsExample /></div>
    <div class="mx-auto max-w-5xl px-5 py-8 md:pl-20">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">Sidebar source</h2>
        <a
          class="review-link text-sm"
          href="https://starwind.dev/docs/components/sidebar/"
          target="_blank"
          rel="noreferrer">View docs</a
        >
      </div>
      <p class="mt-3 text-sm leading-6 text-muted-foreground">
        Desktop state can use this example's own storage key. Mobile navigation has a separate open
        state and uses Sheet for dismissal and focus return.
      </p>
      <details class="source-example">
        <summary>Docs example source</summary>
        <pre><code>{source}</code></pre>
      </details>
    </div>
  </div>
  <div class="mx-auto max-w-5xl px-5 pb-10 md:pl-20">
    <details class="source-example">
      <summary>Workspace content source</summary>
      <pre><code>{contentSource}</code></pre>
    </details>
  </div>
</section>
