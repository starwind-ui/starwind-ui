<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { untrack } from "svelte";
  import { cx } from "tailwind-variants";
  import { CheckboxGroupRoot } from "@starwind-ui/svelte/checkbox-group";
  import { checkboxGroup } from "./variants.js";

  export type CheckboxGroupProps = ComponentProps<typeof CheckboxGroupRoot>;
</script>

<script lang="ts">
  let {
    "defaultValue": defaultValue,
    "disabled": disabled = false,
    "class": className,
    value = $bindable(),
    "value": commandValue,
    "onValueChange": onValueChange,
    "ref": ref,
    "children": children,
    ...rest
  }: CheckboxGroupProps = $props();

  const equal = (left: string[] | undefined, right: string[] | undefined) => left === undefined || right === undefined ? left === right : left.length === right.length && left.every((entry, index) => entry === right[index]);
  let observedCommand = untrack(() => commandValue === undefined ? undefined : [...commandValue]);
  $effect(() => {
    const next = commandValue === undefined ? undefined : [...commandValue];
    untrack(() => {
      if (equal(next, observedCommand)) return;
      observedCommand = next;
      if (!equal(next, value)) value = next;
    });
  });
</script>

<CheckboxGroupRoot
  class={checkboxGroup({ "class": cx(className) })}
  defaultValue={defaultValue}
  disabled={disabled}
  onValueChange={onValueChange}
  ref={ref}
  {...rest}
  data-slot={"checkbox-group"}
  bind:value={value}
>
  {@render children?.()}
</CheckboxGroupRoot>
