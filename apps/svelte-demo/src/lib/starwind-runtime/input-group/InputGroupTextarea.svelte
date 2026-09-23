<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { cx } from "tailwind-variants";
  import { inputGroupTextarea } from "./variants.js";
  import { Textarea } from "../textarea/index.js";

  export type InputGroupTextareaProps = ComponentProps<typeof Textarea>;
</script>

<script lang="ts">
  let {
    "class": className,
    value = $bindable(),
    ref = $bindable(),
    ...rest
  }: InputGroupTextareaProps = $props();
</script>

<Textarea
  class={inputGroupTextarea({ "class": cx(className) })}
  {...rest}
  data-slot={"input-group-control"}
  bind:value={value}
  bind:ref={ref}
/>
