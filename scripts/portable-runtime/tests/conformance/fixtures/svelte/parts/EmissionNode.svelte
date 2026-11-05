<script lang="ts">
  import type { Component } from "svelte";
  import EmissionNode from "./EmissionNode.svelte";

  type Loaded = { component: Component; props: Record<string, unknown>; children: Loaded[] };
  let { node }: { node: Loaded } = $props();
</script>

{#if node.children.length > 0}
  <node.component {...node.props}>
    {#each node.children as child, index (index)}
      <EmissionNode node={child} />
    {/each}
  </node.component>
{:else}
  <node.component {...node.props} />
{/if}
