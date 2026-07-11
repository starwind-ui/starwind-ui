import RadioGroupPrimitive from "@starwind-ui/react/radio-group";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { radioGroup } from "./variants";

export type RadioGroupProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> &
  VariantProps<typeof radioGroup> & {
    defaultValue?: string;
    disabled?: boolean;
    form?: string;
    legend?: string;
    name?: string;
    onValueChange?: (
      value: string,
      details: import("@starwind-ui/react/radio-group").RadioGroupValueChangeDetails,
    ) => void;
    orientation?: "horizontal" | "vertical";
    readOnly?: boolean;
    ref?: React.Ref<HTMLDivElement>;
    required?: boolean;
    value?: import("@starwind-ui/react/radio-group").RadioGroupValue;
  };

function RadioGroup(props: RadioGroupProps) {
  const {
    defaultValue,
    disabled = false,
    form,
    legend,
    name,
    onValueChange,
    orientation = "vertical",
    readOnly = false,
    ref,
    required = false,
    value,
    className,
    children,
    ...rest
  } = props;

  return (
    <RadioGroupPrimitive.Root
      className={radioGroup({ orientation, class: className })}
      defaultValue={defaultValue}
      disabled={disabled}
      form={form}
      name={name}
      onValueChange={onValueChange}
      orientation={orientation}
      readOnly={readOnly}
      ref={ref}
      required={required}
      value={value}
      aria-label={legend}
      {...rest}
      data-slot="radio-group"
    >
      {legend && (
        <div className="sr-only" data-slot="radio-group-legend">
          {legend}
        </div>
      )}

      {children}
    </RadioGroupPrimitive.Root>
  );
}

export default RadioGroup;
