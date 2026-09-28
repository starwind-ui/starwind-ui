<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { InputOtpGroup as PrimitivePart } from "@starwind-ui/svelte/input-otp";
  import { inputOtp, inputOtpGroup, inputOtpSeparator, inputOtpSlot } from "./variants.js";
  import { InputOtpGroup } from "@starwind-ui/svelte/input-otp";

  export type InputOtpGroupProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "ref": ref,
    "children": children,
    ...rest
  }: InputOtpGroupProps = $props();
</script>

<InputOtpGroup
  class={inputOtpGroup({ "class": cx(className) })}
  ref={ref}
  {...rest}
  data-slot={"input-otp-group"}
>
  {@render children?.()}
</InputOtpGroup>
