<script lang="ts">
  import { docsExamples } from "./docs";
  let { component }: { component: keyof typeof docsExamples } = $props();
  const entry = $derived(docsExamples[component]);
</script>

<div class="my-6 min-w-0" data-docs-example={component}>
  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
    <h3 class="text-sm font-semibold">Docs example</h3>
    <a
      class="review-link text-sm text-muted-foreground"
      href={`https://starwind.dev/docs/components/${component}/`}
      target="_blank"
      rel="noreferrer">View docs</a
    >
  </div>
  <div
    class="scenario flex min-h-40 items-center justify-center [&>*]:min-w-0 [&>*]:max-w-full"
    data-docs-preview
  >
    <entry.component />
  </div>
  <details class="source-example">
    <summary>Docs example source</summary>
    <pre><code>{entry.source}</code></pre>
  </details>
</div>
