<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { avatarGroupCount } from "./variants.js";

  export type AvatarGroupCountProps = SvelteHTMLElements["div"] & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: AvatarGroupCountProps = $props();
</script>

<div
  class={avatarGroupCount({ "class": cx(className) })}
  {...rest}
  data-slot={"avatar-group-count"}
  bind:this={ref}
>
  {@render children?.()}
</div>
