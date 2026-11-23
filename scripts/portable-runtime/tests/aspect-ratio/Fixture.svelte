<script>
  import AspectRatio from "../../../../apps/svelte-demo/src/lib/starwind-runtime/aspect-ratio/AspectRatio.svelte";
  import { cases, propsFor, childHtml } from "./cases.mjs";
</script>

{#snippet sample(entry)}
  <AspectRatio {...propsFor(entry, "svelte")}>
    {@html childHtml(entry.child)}
  </AspectRatio>
{/snippet}

{#each cases as entry}
  {#if entry.hostClass}
    <div class={entry.hostClass} style="width: 320px">
      {@render sample(entry)}
    </div>
  {:else}
    {@render sample(entry)}
  {/if}
{/each}
