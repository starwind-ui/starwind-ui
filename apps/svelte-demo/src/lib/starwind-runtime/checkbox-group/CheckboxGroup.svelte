<script module lang="ts">
  import type { ComponentProps } from "svelte";
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
</script>

<CheckboxGroupRoot
  class={checkboxGroup({ "class": cx(className) })}
  defaultValue={defaultValue}
  disabled={disabled}
  onValueChange={onValueChange}
  ref={ref}
  {...rest}
  data-slot={"checkbox-group"}
  bind:value={() => commandValue, (next) => { value = next; }}
>
  {@render children?.()}
</CheckboxGroupRoot>
