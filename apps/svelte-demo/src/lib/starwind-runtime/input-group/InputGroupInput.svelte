<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { untrack } from "svelte";
  import { cx } from "tailwind-variants";
  import { inputGroupInput } from "./variants.js";
  import { Input } from "../input/index.js";

  export type InputGroupInputProps = ComponentProps<typeof Input>;
</script>

<script lang="ts">
  let {
    "class": className,
    value = $bindable(),
    "value": commandValue,
    ...rest
  }: InputGroupInputProps = $props();

  // Observe incoming arrays even after the composed bindable value publishes locally.
  const copyCommand = (next: InputGroupInputProps["value"]) => Array.isArray(next) ? [...next] : next;
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

<Input
  class={inputGroupInput({ "class": cx(className) })}
  {...rest}
  data-slot={"input-group-control"}
  bind:value={value}
/>
