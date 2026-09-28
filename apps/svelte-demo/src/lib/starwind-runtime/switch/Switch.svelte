<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SwitchRoot } from "@starwind-ui/svelte/switch";
  import { switchWrapper, switchButton, switchToggle, switchLabel } from "./variants.js";
  import { SwitchThumb } from "@starwind-ui/svelte/switch";

  type NativeProps=Extract<ComponentProps<typeof SwitchRoot>,{nativeButton:true}>;
  export type SwitchProps=Omit<NativeProps,"nativeButton"|"children"|"id"> & VariantProps<typeof switchButton> & VariantProps<typeof switchToggle> & {id:string;label?:string;padding?:number};
</script>

<script lang="ts">
  let {
    "variant": variant = "default",
    "size": size = "md",
    "defaultChecked": defaultChecked,
    "disabled": disabled = false,
    "form": form,
    "id": id,
    "label": label,
    "name": name,
    "padding": padding,
    "readOnly": readOnly = false,
    "required": required = false,
    "uncheckedValue": uncheckedValue,
    "value": value,
    "class": className,
    checked = $bindable(),
    "ref": ref,
    "onCheckedChange": onCheckedChange,
    ...rest
  }: SwitchProps = $props();

  let resolvedPadding = $derived(padding ?? (size === "sm" ? 2.5 : size === "lg" ? 4 : 3));

  let sizeMultiplier = $derived(size === "sm" ? 4 : size === "lg" ? 6 : 5);

  let ariaLabel = $derived(rest["aria-label"] ?? label ?? "switch");

  let switchStyle = $derived(Object.entries({ "--padding": String(resolvedPadding) + "px", "--height": "calc((var(--spacing) * " + String(sizeMultiplier) + ") + (var(--padding) * 2))", "--width": "calc((var(--spacing) * " + String(sizeMultiplier) + " * 2) + (var(--padding) * 3))", "--border-offset": "1px" }).map(([key, value]) => key + ":" + value).join(";"));

  let thumbStyle = $derived(Object.entries({ "--translation": "calc((var(--spacing) * " + String(sizeMultiplier) + ") + (var(--padding) * 2) - var(--border-offset))" }).map(([key, value]) => key + ":" + value).join(";"));
</script>

<div
  class={switchWrapper({  })}
  data-sw-switch-wrapper
  data-slot={"switch-wrapper"}
>
  <SwitchRoot
    class={switchButton({ "variant": variant, "class": cx(className) })}
    defaultChecked={defaultChecked}
    disabled={disabled}
    form={form}
    id={id}
    name={name}
    nativeButton
    onCheckedChange={onCheckedChange}
    readOnly={readOnly}
    ref={ref}
    required={required}
    uncheckedValue={uncheckedValue}
    value={value}
    style={switchStyle}
    {...rest}
    aria-label={ariaLabel}
    data-slot={"switch-button"}
    bind:checked={checked}
  >
    <SwitchThumb
      class={switchToggle({ "size": size })}
      style={thumbStyle}
      data-slot={"switch-toggle"}
    >

    </SwitchThumb>
  </SwitchRoot>
  {#if label}
    <label
      for={id}
      class={switchLabel({ "size": size })}
      data-slot={"switch-label"}
    >
      {label}
    </label>
  {/if}
</div>
