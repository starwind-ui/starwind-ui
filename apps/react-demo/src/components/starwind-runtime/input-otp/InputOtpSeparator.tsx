import InputOtpPrimitive from "@starwind-ui/react/input-otp";
import { IconMinus as Minus } from "@tabler/icons-react";
import type * as React from "react";
import { inputOtpSeparator } from "./variants";

export type InputOtpSeparatorProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
  icon?: React.ReactNode;
};

function InputOtpSeparator(props: InputOtpSeparatorProps) {
  const { ref, className, icon, ...rest } = props;

  return (
    <InputOtpPrimitive.Separator
      className={inputOtpSeparator({ class: className })}
      ref={ref}
      {...rest}
      data-slot="input-otp-separator"
    >
      {icon ?? <Minus className="size-6" />}
    </InputOtpPrimitive.Separator>
  );
}

export default InputOtpSeparator;
