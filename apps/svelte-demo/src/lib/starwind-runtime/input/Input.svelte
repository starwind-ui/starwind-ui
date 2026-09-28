<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { untrack } from "svelte";
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

  // Keep incoming commands observable after the bindable model publishes locally.
  const copyCommand = (next: InputProps["value"]) => Array.isArray(next) ? [...next] : next;
  let observedCommand = untrack(() => copyCommand(commandValue));
  $effect(() => {
    const next = copyCommand(commandValue);
    untrack(() => {
      const previous = observedCommand;
      if (Array.isArray(next) && Array.isArray(previous) ? next.length === previous.length && next.every((entry, index) => entry === previous[index]) : Object.is(next, previous)) return;
      observedCommand = next;
      const current = value;
      if (Array.isArray(next) && Array.isArray(current) ? next.length === current.length && next.every((entry, index) => entry === current[index]) : Object.is(next, current)) return;
      value = next;
    });
  });
</script>

<InputRoot
  class={input({ "size": size, "class": cx(className) })}
  defaultValue={defaultValue}
  disabled={disabled}
  onValueChange={onValueChange}
  ref={ref}
  data-slot={dataSlot}
  {...rest}
  bind:value={value}
/>
