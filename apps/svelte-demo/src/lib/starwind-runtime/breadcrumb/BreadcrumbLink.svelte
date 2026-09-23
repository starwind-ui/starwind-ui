<script module lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { cx } from "tailwind-variants";
  import { breadcrumbLink } from "./variants.js";

  export type BreadcrumbLinkProps = Omit<HTMLAnchorAttributes, "children"> & { asChild?: boolean; children?: Snippet; ref?: HTMLAnchorElement; };
</script>

<script lang="ts">
  let {
    "asChild": asChild = false,
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: BreadcrumbLinkProps = $props();
</script>

{#if asChild}
  {@render children?.()}
{:else}
  <a
    data-sw-breadcrumb-link
    class={breadcrumbLink({ "class": cx(className) })}
    {...rest}
    data-slot={"breadcrumb-link"}
    bind:this={ref}
  >
    {@render children?.()}
  </a>
{/if}
