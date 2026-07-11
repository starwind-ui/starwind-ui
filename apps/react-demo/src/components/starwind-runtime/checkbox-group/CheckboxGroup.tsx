import CheckboxGroupPrimitive from "@starwind-ui/react/checkbox-group";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { checkboxGroup } from "./variants";

export type CheckboxGroupProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> &
  VariantProps<typeof checkboxGroup> & {
    defaultValue?: string[];
    disabled?: boolean;
    onValueChange?: (
      value: import("@starwind-ui/react/checkbox-group").CheckboxGroupValue,
      details: import("@starwind-ui/react/checkbox-group").CheckboxGroupValueChangeDetails,
    ) => void;
    ref?: React.Ref<HTMLDivElement>;
    value?: import("@starwind-ui/react/checkbox-group").CheckboxGroupValue;
  };

function CheckboxGroup(props: CheckboxGroupProps) {
  const {
    defaultValue,
    disabled = false,
    onValueChange,
    ref,
    value,
    className,
    children,
    ...rest
  } = props;

  return (
    <CheckboxGroupPrimitive.Root
      className={checkboxGroup({ class: className })}
      defaultValue={defaultValue}
      disabled={disabled}
      onValueChange={onValueChange}
      ref={ref}
      value={value}
      {...rest}
      data-slot="checkbox-group"
    >
      {children}
    </CheckboxGroupPrimitive.Root>
  );
}

export default CheckboxGroup;
