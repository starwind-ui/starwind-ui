<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { alert } from "./variants.js";

  export type AlertProps = SvelteHTMLElements["div"] & VariantProps<typeof alert> & { ref?: HTMLDivElement;  };
</script>

<script lang="ts">
  let {
    "variant": variant,
    "role": role,
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: AlertProps = $props();

  let inferredRole = $derived(role ?? (variant === "error" || variant === "warning" ? "alert" : "status"));
</script>

<div
  data-sw-alert
  class={alert({ "variant": variant, "class": cx(className) })}
  role={inferredRole}
  {...rest}
  data-slot={"alert"}
  bind:this={ref}
>
  {@render children?.()}
</div>
