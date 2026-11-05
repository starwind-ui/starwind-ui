<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ToggleRoot } from "@starwind-ui/svelte/toggle";
  import { toggleGroup, toggleGroupItem } from "./variants.js";

  type PrimitiveProps=ComponentProps<typeof ToggleRoot>;
  type StyledProps<T>=T extends unknown?Omit<T,"syncGroup"> & {variant?:"default"|"outline"}:never;
  export type ToggleGroupItemProps=StyledProps<PrimitiveProps>;
</script>

<script lang="ts">
  let {
    "variant": variant,
    "defaultPressed": defaultPressed,
    "disabled": disabled = false,
    "nativeButton": nativeButton,
    "value": value,
    "class": className,
    pressed = $bindable(),
    "pressed": commandValue,
    "ref": ref,
    "onPressedChange": onPressedChange,
    "children": children,
    "pressed": commandPressed,
    ...rest
  }: ToggleGroupItemProps = $props();
</script>

<ToggleRoot
  class={toggleGroupItem({ "variant": variant, "class": cx(className) })}
  data-variant={variant}
  {...({ ...rest, nativeButton, ref, value, defaultPressed, disabled, onPressedChange } as PrimitiveProps)}
  data-slot={"toggle-group-item"}
  bind:pressed={() => commandPressed, (next) => { pressed = next; }}
>
  {@render children?.()}
</ToggleRoot>
