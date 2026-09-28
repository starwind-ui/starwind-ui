<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { avatarGroup } from "./variants.js";

  export type AvatarGroupProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: AvatarGroupProps = $props();
</script>

<div
  class={avatarGroup({ "class": cx(className) })}
  {...rest}
  data-slot={"avatar-group"}
  bind:this={ref}
>
  {@render children?.()}
</div>
