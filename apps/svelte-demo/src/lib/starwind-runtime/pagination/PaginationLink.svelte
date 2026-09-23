<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { cx } from "tailwind-variants";
  import { Button } from "../button/index.js";

  export type PaginationLinkProps = Omit<Extract<ComponentProps<typeof Button>, { as: "a" }>, "variant" | "as" | "ref"> & { "isActive"?: boolean; ref?: (element: HTMLAnchorElement | null) => void; };
</script>

<script lang="ts">
  let {
    "isActive": isActive,
    "size": size = "icon",
    "data-slot": dataSlot = "pagination-link",
    "class": className,
    "ref": ref,
    "children": children,
    ...rest
  }: PaginationLinkProps = $props();

  let ownerRef = $derived(ref);
</script>

<Button
  aria-current={isActive ? "page" : undefined}
  variant={isActive ? "outline" : "ghost"}
  size={size}
  class={className}
  {...rest}
  as={"a"}
  data-slot={dataSlot}
  ref={ownerRef}
>
  {@render children?.()}
</Button>
