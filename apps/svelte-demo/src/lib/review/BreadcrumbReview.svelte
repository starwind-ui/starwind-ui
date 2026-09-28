<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/BreadcrumbExample.svelte";
  import source from "./examples/BreadcrumbExample.svelte?raw";
  import routerSource from "./examples/BreadcrumbRouterLink.svelte?raw";
</script>

<section
  data-styled-review="breadcrumb"
  id="breadcrumb-review"
  class="review-card min-w-0"
  aria-labelledby="breadcrumb-heading"
>
  <div class="section-heading">
    <h2 id="breadcrumb-heading">Breadcrumb</h2>
    <span class="component-label">breadcrumb</span>
  </div>
  <p>
    Follow a document path or inspect a compact path. Use Tab to focus each link and Enter to visit
    its target.
  </p>
  <DocsExample component="breadcrumb" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
    <details class="source-example">
      <summary>Custom link source</summary>
      <pre><code>{routerSource}</code></pre>
    </details>
  </div>
</section>
