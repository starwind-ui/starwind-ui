<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ToggleGroupRoot } from "@starwind-ui/svelte/toggle-group";
  import { toggleGroup, toggleGroupItem } from "./variants.js";

  export type ToggleGroupProps=ComponentProps<typeof ToggleGroupRoot> & {variant?:"default"|"outline";size?:"sm"|"md"|"lg";spacing?:number};
</script>

<script lang="ts">
  let {
    "variant": variant = "default",
    "size": size = "md",
    "spacing": spacing = 2,
    "defaultValue": defaultValue,
    "disabled": disabled = false,
    "loopFocus": loopFocus,
    "multiple": multiple = false,
    "orientation": orientation = "horizontal",
    "style": style,
    "class": className,
    value = $bindable(),
    "value": commandValue,
    "ref": ref,
    "onValueChange": onValueChange,
    "children": children,
    ...rest
  }: ToggleGroupProps = $props();

  let toggleGroupStyle = $derived(`--gap: ${spacing}; ${style ?? ""}`);
</script>

<ToggleGroupRoot
  class={toggleGroup({ "class": cx(className) })}
  data-variant={variant}
  data-spacing={spacing}
  data-horizontal={orientation === "horizontal" ? "" : undefined}
  data-vertical={orientation === "vertical" ? "" : undefined}
  defaultValue={defaultValue}
  disabled={disabled}
  loopFocus={loopFocus}
  multiple={multiple}
  orientation={orientation}
  onValueChange={onValueChange}
  ref={ref}
  style={toggleGroupStyle}
  {...rest}
  data-size={size}
  data-slot={"toggle-group"}
  bind:value={() => commandValue, (next) => { value = next; }}
>
  {@render children?.()}
</ToggleGroupRoot>
