import InputOtpPrimitive from "@starwind-ui/react/input-otp";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { inputOtpSlot } from "./variants";

export type InputOtpSlotProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof inputOtpSlot> & {
    index?: number;
    ref?: React.Ref<HTMLDivElement>;
  };

function InputOtpSlot(props: InputOtpSlotProps) {
  const { size, index, ref, className, ...rest } = props;

  return (
    <InputOtpPrimitive.Slot
      className={inputOtpSlot({ size, class: className })}
      index={index}
      ref={ref}
      {...rest}
      data-slot="input-otp-slot"
    />
  );
}

export default InputOtpSlot;
