<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/ButtonGroupExample.svelte";
  import source from "./examples/ButtonGroupExample.svelte?raw";
</script>

<section
  data-styled-review="button-group"
  id="button-group-review"
  class="review-card min-w-0"
  aria-labelledby="button-group-heading"
>
  <div class="section-heading">
    <h2 id="button-group-heading">Button Group</h2>
    <span class="component-label">button-group</span>
  </div>
  <p>
    Select an alignment or change the group orientation. Each control keeps its native keyboard
    behavior.
  </p>
  <DocsExample component="button-group" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <p class="text-sm" data-example-overrides>
      Explicit layout override: the action below the groups adds a top margin.
    </p>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
