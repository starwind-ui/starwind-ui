"use client";

import type * as React from "react";
import "./styles.css";
import InputOtpPrimitive from "@starwind-ui/react/input-otp";
import { inputOtpSlot } from "./variants";

export type InputOtpSlotProps = React.ComponentPropsWithoutRef<"div"> & {
  index?: number;
  ref?: React.Ref<HTMLDivElement>;
};

function InputOtpSlot(props: InputOtpSlotProps) {
  const { index, ref, className, ...rest } = props;

  return (
    <InputOtpPrimitive.Slot
      className={inputOtpSlot({ class: className })}
      index={index}
      ref={ref}
      {...rest}
      data-slot="input-otp-slot"
    />
  );
}

export default InputOtpSlot;
