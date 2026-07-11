import InputOtpPrimitive from "@starwind-ui/react/input-otp";
import type * as React from "react";
import { inputOtpGroup } from "./variants";

export type InputOtpGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function InputOtpGroup(props: InputOtpGroupProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <InputOtpPrimitive.Group
      className={inputOtpGroup({ class: className })}
      ref={ref}
      {...rest}
      data-slot="input-otp-group"
    >
      {children}
    </InputOtpPrimitive.Group>
  );
}

export default InputOtpGroup;
