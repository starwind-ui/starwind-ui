<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ToggleRoot } from "@starwind-ui/svelte/toggle";
  import { toggle } from "./variants.js";

  type PrimitiveProps=ComponentProps<typeof ToggleRoot>;
  type StyledProps<T>=T extends unknown?T & VariantProps<typeof toggle>:never;
  export type ToggleProps=StyledProps<PrimitiveProps>;
</script>

<script lang="ts">
  let {
    variant,
    size,
    defaultPressed,
    disabled = false,
    nativeButton,
    syncGroup,
    value,
    "data-slot": dataSlot = "toggle",
    "class": className,
    pressed = $bindable(),
    "pressed": commandValue,
    ref,
    onPressedChange,
    children,
    "pressed": commandPressed,
    ...rest
  }: ToggleProps = $props();
</script>

<ToggleRoot
  class={toggle({ "variant": variant, "size": size, "class": cx(className) })}
  {...({ ...rest, nativeButton, ref, value, defaultPressed, disabled, onPressedChange, syncGroup } as PrimitiveProps)}
  data-slot={dataSlot}
  bind:pressed={() => commandPressed, (next) => { pressed = next; }}
>
  {@render children?.()}
</ToggleRoot>
