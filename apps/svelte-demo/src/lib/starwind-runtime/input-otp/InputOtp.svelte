<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { InputOtpRoot as PrimitivePart } from "@starwind-ui/svelte/input-otp";
  import { inputOtp, inputOtpGroup, inputOtpSeparator, inputOtpSlot } from "./variants.js";
  import { InputOtpRoot } from "@starwind-ui/svelte/input-otp";

  export type InputOtpProps = ComponentProps<typeof PrimitivePart> & VariantProps<typeof inputOtp> & { size?: "sm" | "md" | "lg" };
</script>

<script lang="ts">
  let {
    defaultValue,
    disabled = false,
    form,
    id,
    maxLength = 6,
    name,
    pattern,
    readOnly = false,
    required = false,
    size = "md",
    "class": className,
    ref,
    value = $bindable(),
    "value": commandValue,
    onValueChange,
    children,
    ...rest
  }: InputOtpProps = $props();
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
  bind:value={() => commandValue, (next) => { value = next; }}
>
  {@render children?.()}
</InputOtpRoot>
