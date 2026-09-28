<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { InputOtpSeparator as PrimitivePart } from "@starwind-ui/svelte/input-otp";
  import { inputOtp, inputOtpGroup, inputOtpSeparator, inputOtpSlot } from "./variants.js";
  import { InputOtpSeparator } from "@starwind-ui/svelte/input-otp";

  export type InputOtpSeparatorProps = Omit<ComponentProps<typeof PrimitivePart>, "children"> & { icon?: Snippet };
</script>

<script lang="ts">
  let {
    "class": className,
    "ref": ref,
    "icon": icon,
    ...rest
  }: InputOtpSeparatorProps = $props();
</script>

<InputOtpSeparator
  class={inputOtpSeparator({ "class": cx(className) })}
  ref={ref}
  {...rest}
  data-slot={"input-otp-separator"}
>
  {#if icon}{@render icon()}{:else}<svg
    xmlns={"http://www.w3.org/2000/svg"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    stroke-width={"2"}
    stroke-linecap={"round"}
    stroke-linejoin={"round"}
    aria-hidden={"true"}
    class={"size-6"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M5 12h14"}
    />
  </svg>{/if}
</InputOtpSeparator>
