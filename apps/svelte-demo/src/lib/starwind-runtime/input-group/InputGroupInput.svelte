<script module lang="ts">
  import type { ComponentProps } from "svelte";
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
</script>

<Input
  class={inputGroupInput({ "class": cx(className) })}
  {...rest}
  data-slot={"input-group-control"}
  bind:value={() => commandValue, (next) => { value = next; }}
/>
