<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { RadioRoot } from "@starwind-ui/svelte/radio";
  import { radioGroup, radioWrapper, radioItem, radioControl, radioIndicator } from "./variants.js";
  import { RadioIndicator } from "@starwind-ui/svelte/radio";

  type PrimitiveProps=ComponentProps<typeof RadioRoot>;
  type WithStyledProps<T>=T extends unknown?Omit<T,"children"> & VariantProps<typeof radioControl> & {icon?:Snippet}:never;
  export type RadioGroupItemProps=WithStyledProps<PrimitiveProps>;
</script>

<script lang="ts">
  let {
    "variant": variant,
    "defaultChecked": defaultChecked,
    "disabled": disabled = false,
    "form": form,
    "id": id,
    "name": name,
    "nativeButton": nativeButton = false,
    "readOnly": readOnly = false,
    "required": required = false,
    "value": value,
    "class": className,
    checked = $bindable(),
    "checked": commandValue,
    "ref": ref,
    "onCheckedChange": onCheckedChange,
    "icon": icon,
    "checked": commandChecked,
    ...rest
  }: RadioGroupItemProps = $props();
</script>

<div
  class={radioWrapper({  })}
  data-slot={"radio-group-item-wrapper"}
>
  <RadioRoot
    class={radioItem({  })}
    {...({ ...rest, nativeButton, ref, value, defaultChecked, disabled, form, id, name, onCheckedChange, readOnly, required } as PrimitiveProps)}
    data-slot={"radio-group-item"}
    bind:checked={() => commandChecked, (next) => { checked = next; }}
  >
    <span
      class={radioControl({ "variant": variant, "class": cx(className) })}
      data-slot={"radio-group-item-control"}
    >
      <RadioIndicator
        class={radioIndicator({  })}
        data-slot={"radio-group-item-indicator"}
      >
        {#if icon}{@render icon()}{:else}<svg
          xmlns={"http://www.w3.org/2000/svg"}
          viewBox={"0 0 24 24"}
          fill={"currentColor"}
          aria-hidden={"true"}
        >
          <path
            d={"M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z"}
            stroke={"none"}
          />
        </svg>{/if}
      </RadioIndicator>
    </span>
  </RadioRoot>
</div>
