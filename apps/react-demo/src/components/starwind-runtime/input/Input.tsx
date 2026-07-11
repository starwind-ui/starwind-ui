import InputPrimitive from "@starwind-ui/react/input";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { input } from "./variants";

export type InputProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "children" | "defaultValue" | "size" | "value"
> &
  VariantProps<typeof input> & {
    defaultValue?: import("@starwind-ui/react/input").InputValue;
    onValueChange?: (
      value: string,
      details: import("@starwind-ui/react/input").InputValueChangeDetails,
    ) => void;
    ref?: React.Ref<HTMLInputElement>;
    "data-slot"?: string;
    value?: import("@starwind-ui/react/input").InputValue;
  };

function Input(props: InputProps) {
  const {
    size,
    defaultValue,
    disabled = false,
    onValueChange,
    ref,
    value,
    "data-slot": dataSlot = "input",
    className,
    ...rest
  } = props;

  return (
    <InputPrimitive.Root
      className={input({ size, class: className })}
      defaultValue={defaultValue}
      disabled={disabled}
      onValueChange={onValueChange}
      ref={ref}
      value={value}
      data-slot={dataSlot}
      {...rest}
    />
  );
}

export default Input;
