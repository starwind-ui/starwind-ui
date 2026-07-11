import FieldPrimitive from "@starwind-ui/react/field";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { fieldControl } from "./variants";

export type FieldControlProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "children" | "defaultValue" | "size" | "value"
> &
  VariantProps<typeof fieldControl> & {
    defaultValue?: import("@starwind-ui/react/field").InputValue;
    onValueChange?: (
      value: string,
      details: import("@starwind-ui/react/field").InputValueChangeDetails,
    ) => void;
    ref?: React.Ref<HTMLInputElement>;
    value?: import("@starwind-ui/react/field").InputValue;
  };

function FieldControl(props: FieldControlProps) {
  const {
    size,
    defaultValue,
    disabled = false,
    onValueChange,
    ref,
    value,
    className,
    ...rest
  } = props;

  return (
    <FieldPrimitive.Control
      className={fieldControl({ size, class: className })}
      defaultValue={defaultValue}
      disabled={disabled}
      onValueChange={onValueChange}
      ref={ref}
      value={value}
      {...rest}
      data-slot="field-control"
    />
  );
}

export default FieldControl;
