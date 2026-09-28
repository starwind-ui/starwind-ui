<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { cx } from "tailwind-variants";
  import { default as PaginationLink } from "./PaginationLink.svelte";

  export type PaginationPreviousProps = ComponentProps<typeof PaginationLink> & { icon?: Snippet; };
</script>

<script lang="ts">
  let {
    "size": size = "md",
    "class": className,
    "ref": ref,
    "children": children,
    "icon": icon,
    ...rest
  }: PaginationPreviousProps = $props();

  let ownerRef = $derived(ref);
</script>

<PaginationLink
  aria-label={"Go to previous page"}
  size={size}
  class={className}
  {...rest}
  data-slot={"pagination-previous"}
  ref={ownerRef}
>
  {#if icon}{@render icon()}{:else}<svg
    xmlns={"http://www.w3.org/2000/svg"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    stroke-width={"2"}
    stroke-linecap={"round"}
    stroke-linejoin={"round"}
    aria-hidden={"true"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M15 6l-6 6l6 6"}
    />
  </svg>{/if}
  {@render children?.()}
</PaginationLink>
