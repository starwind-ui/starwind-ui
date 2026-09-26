<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { InputOtpSlot as PrimitivePart } from "@starwind-ui/svelte/input-otp";
  import { inputOtp, inputOtpGroup, inputOtpSeparator, inputOtpSlot } from "./variants.js";
  import { InputOtpSlot } from "@starwind-ui/svelte/input-otp";
  import "./styles.css";

  export type InputOtpSlotProps = Omit<ComponentProps<typeof PrimitivePart>, "caret">;
</script>

<script lang="ts">
  let {
    "index": index,
    "class": className,
    "ref": ref,
    ...rest
  }: InputOtpSlotProps = $props();
</script>

<InputOtpSlot
  class={inputOtpSlot({ "class": cx(className) })}
  index={index}
  ref={ref}
  {...rest}
  data-slot={"input-otp-slot"}
/>
