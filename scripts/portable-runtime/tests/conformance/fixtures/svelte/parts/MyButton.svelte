<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  let { children, ...rest }: HTMLButtonAttributes & { children?: Snippet } = $props();
</script>

<button {...rest}>{@render children?.()}</button>
