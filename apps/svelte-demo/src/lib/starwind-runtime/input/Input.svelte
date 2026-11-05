<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { InputRoot } from "@starwind-ui/svelte/input";
  import { input } from "./variants.js";

  export type InputProps = Omit<ComponentProps<typeof InputRoot>, "size"> & VariantProps<typeof input>;
</script>

<script lang="ts">
  let {
    "size": size,
    "defaultValue": defaultValue,
    "disabled": disabled = false,
    "data-slot": dataSlot = "input",
    "class": className,
    value = $bindable(),
    "value": commandValue,
    "onValueChange": onValueChange,
    "ref": ref,
    ...rest
  }: InputProps = $props();
</script>

<InputRoot
  class={input({ "size": size, "class": cx(className) })}
  defaultValue={defaultValue}
  disabled={disabled}
  onValueChange={onValueChange}
  ref={ref}
  data-slot={dataSlot}
  {...rest}
  bind:value={() => commandValue, (next) => { value = next; }}
/>
