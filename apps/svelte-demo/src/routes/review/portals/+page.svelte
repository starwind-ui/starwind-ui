<script lang="ts">
  import PortalCompositions from "$lib/review/PortalCompositions.svelte";
  import source from "$lib/review/PortalCompositions.svelte?raw";
  import { Button } from "$lib/starwind-runtime/button";
  let mounted = $state(true);
</script>

<svelte:head><title>Portal compositions · Starwind Svelte</title></svelte:head>
<main id="main" class="review-shell">
  <header class="review-hero">
    <p class="eyebrow">Overlay review</p>
    <h1>Portal compositions</h1>
    <p>
      Check each layer with a pointer and keyboard. Escape closes the inner layer first and returns
      focus to its trigger.
    </p>
    <a href="/review/">Back to component catalog</a>
    <div class="mt-4">
      <Button variant="outline" onclick={() => (mounted = !mounted)}
        >{mounted ? "Unmount examples" : "Mount examples"}</Button
      >
    </div>
  </header>
  {#if mounted}<PortalCompositions />{/if}
  <details class="source-example mt-6">
    <summary>Source for all compositions</summary>
    <pre><code>{source}</code></pre>
  </details>
</main>
