<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";

  let { to, children, ...props }: Omit<HTMLAnchorAttributes, "href"> & { to: string } = $props();
</script>

<a {...props} href={to} data-review-router-link>{@render children?.()}</a>
