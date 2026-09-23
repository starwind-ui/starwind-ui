<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { untrack } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { RadioGroupRoot } from "@starwind-ui/svelte/radio-group";
  import { radioGroup, radioWrapper, radioItem, radioControl, radioIndicator } from "./variants.js";

  export type RadioGroupProps=ComponentProps<typeof RadioGroupRoot> & {legend?:string;size?:"sm"|"md"|"lg"};
</script>

<script lang="ts">
  let {
    "defaultValue": defaultValue,
    "disabled": disabled = false,
    "form": form,
    "legend": legend,
    "name": name,
    "orientation": orientation = "vertical",
    "readOnly": readOnly = false,
    "required": required = false,
    "size": size = "md",
    "class": className,
    value = $bindable(),
    "value": commandValue,
    "ref": ref,
    "onValueChange": onValueChange,
    "children": children,
    ...rest
  }: RadioGroupProps = $props();

  let observedCommand=untrack(()=>commandValue);
  $effect(()=>{const next=commandValue;untrack(()=>{if(Object.is(next,observedCommand))return;observedCommand=next;if(!Object.is(next,value))value=next;});});
</script>

<RadioGroupRoot
  class={radioGroup({ "orientation": orientation, "class": cx(className) })}
  defaultValue={defaultValue}
  disabled={disabled}
  form={form}
  name={name}
  onValueChange={onValueChange}
  orientation={orientation}
  readOnly={readOnly}
  ref={ref}
  required={required}
  aria-label={legend}
  {...rest}
  data-size={size}
  data-slot={"radio-group"}
  bind:value={value}
>
  {#if legend}
    <div
      class={"sr-only"}
      data-slot={"radio-group-legend"}
    >
      {legend}
    </div>
  {/if}
  {@render children?.()}
</RadioGroupRoot>
