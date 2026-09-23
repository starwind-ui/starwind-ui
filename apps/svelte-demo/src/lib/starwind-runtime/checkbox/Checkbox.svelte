<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { CheckboxRoot } from "@starwind-ui/svelte/checkbox";
  import { checkboxWrapper, checkbox, checkboxIndicator, checkboxLabel } from "./variants.js";
  import { CheckboxIndicator } from "@starwind-ui/svelte/checkbox";
  import "./styles.css";

  type PrimitiveProps = ComponentProps<typeof CheckboxRoot>;
  type WithStyledProps<T> = T extends unknown ? Omit<T, "children"> & VariantProps<typeof checkbox> & { label?: string } : never;
  export type CheckboxProps = WithStyledProps<PrimitiveProps>;
</script>

<script lang="ts">
  let {
    "variant": variant,
    "size": size,
    "defaultChecked": defaultChecked,
    "disabled": disabled = false,
    "form": form,
    "id": id,
    "indeterminate": indeterminate = false,
    "label": label,
    "name": name,
    "nativeButton": nativeButton = false,
    "readOnly": readOnly = false,
    "required": required = false,
    "uncheckedValue": uncheckedValue,
    "value": value,
    "class": className,
    checked = $bindable(),
    "onCheckedChange": onCheckedChange,
    "ref": ref,
    ...rest
  }: CheckboxProps = $props();

  let ariaLabel = $derived(rest["aria-label"] ?? label);
</script>

<div
  class={checkboxWrapper({  })}
  data-sw-checkbox-wrapper
  data-slot={"checkbox-wrapper"}
>
  <CheckboxRoot
    class={checkbox({ "variant": variant, "size": size, "class": cx(className) })}
    defaultChecked={defaultChecked}
    disabled={disabled}
    form={form}
    id={id}
    indeterminate={indeterminate}
    name={name}
    onCheckedChange={onCheckedChange}
    readOnly={readOnly}
    required={required}
    uncheckedValue={uncheckedValue}
    value={value}
    {...({ ...rest, nativeButton, ref } as PrimitiveProps)}
    aria-label={ariaLabel}
    data-slot={"checkbox"}
    bind:checked={checked}
  >
    <CheckboxIndicator
      keepMounted
      class={checkboxIndicator({ "variant": variant, "size": size })}
      data-slot={"checkbox-indicator"}
    >
      <svg
        xmlns={"http://www.w3.org/2000/svg"}
        viewBox={"0 0 24 24"}
        fill={"none"}
        stroke={"currentColor"}
        stroke-width={"2"}
        stroke-linecap={"round"}
        stroke-linejoin={"round"}
        aria-hidden={"true"}
        data-sw-checkbox-check-icon
      >
        <path
          stroke={"none"}
          d={"M0 0h24v24H0z"}
          fill={"none"}
        />
        <path
          d={"M5 12l5 5l10 -10"}
        />
      </svg>
    </CheckboxIndicator>
  </CheckboxRoot>
  {#if label}
    <label
      for={id}
      class={checkboxLabel({ "size": size })}
      data-slot={"checkbox-label"}
    >
      {label}
    </label>
  {/if}
</div>
