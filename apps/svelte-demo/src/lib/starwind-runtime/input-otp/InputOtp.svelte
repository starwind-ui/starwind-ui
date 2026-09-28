<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { untrack } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { InputOtpRoot as PrimitivePart } from "@starwind-ui/svelte/input-otp";
  import { inputOtp, inputOtpGroup, inputOtpSeparator, inputOtpSlot } from "./variants.js";
  import { InputOtpRoot } from "@starwind-ui/svelte/input-otp";

  export type InputOtpProps = ComponentProps<typeof PrimitivePart> & VariantProps<typeof inputOtp> & { size?: "sm" | "md" | "lg" };
</script>

<script lang="ts">
  let {
    "defaultValue": defaultValue,
    "disabled": disabled = false,
    "form": form,
    "id": id,
    "maxLength": maxLength = 6,
    "name": name,
    "pattern": pattern,
    "readOnly": readOnly = false,
    "required": required = false,
    "size": size = "md",
    "class": className,
    "ref": ref,
    value = $bindable(),
    "value": commandValue,
    "onValueChange": onValueChange,
    "children": children,
    ...rest
  }: InputOtpProps = $props();

  // Observe incoming commands after local bindable publication shadows a plain prop.
  let observedCommand = untrack(() => commandValue);
  $effect(() => {
    const next = commandValue;
    untrack(() => {
      if (Object.is(next, observedCommand)) return;
      observedCommand = next;
      if (!Object.is(next, value)) value = next;
    });
  });
</script>

<InputOtpRoot
  class={inputOtp({ "class": cx(className) })}
  defaultValue={defaultValue}
  disabled={disabled}
  form={form}
  id={id}
  maxLength={maxLength}
  name={name}
  onValueChange={onValueChange}
  pattern={pattern}
  ref={ref}
  readOnly={readOnly}
  required={required}
  {...rest}
  data-size={size}
  data-slot={"input-otp"}
  bind:value={value}
>
  {@render children?.()}
</InputOtpRoot>
