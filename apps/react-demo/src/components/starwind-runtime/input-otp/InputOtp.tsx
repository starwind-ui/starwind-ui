import InputOtpPrimitive from "@starwind-ui/react/input-otp";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { inputOtp } from "./variants";

export type InputOtpProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "id" | "onChange" | "pattern" | "value"
> &
  VariantProps<typeof inputOtp> & {
    defaultValue?: string;
    disabled?: boolean;
    form?: string;
    id?: string;
    maxLength?: number;
    name?: string;
    onValueChange?: (
      value: string,
      details: import("@starwind-ui/react/input-otp").InputOtpValueChangeDetails,
    ) => void;
    pattern?: RegExp | string;
    ref?: React.Ref<HTMLDivElement>;
    readOnly?: boolean;
    required?: boolean;
    value?: string;
  };

function InputOtp(props: InputOtpProps) {
  const {
    defaultValue,
    disabled = false,
    form,
    id,
    maxLength = 6,
    name,
    onValueChange,
    pattern,
    ref,
    readOnly = false,
    required = false,
    value,
    className,
    children,
    ...rest
  } = props;

  return (
    <InputOtpPrimitive.Root
      className={inputOtp({ class: className })}
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
      value={value}
      {...rest}
      data-slot="input-otp"
    >
      {children}
    </InputOtpPrimitive.Root>
  );
}

export default InputOtp;
