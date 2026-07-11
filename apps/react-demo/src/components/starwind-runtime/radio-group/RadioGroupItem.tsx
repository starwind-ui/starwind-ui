import RadioPrimitive from "@starwind-ui/react/radio";
import { IconCircleFilled as CircleFilled } from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { radioControl, radioIndicator, radioItem, radioWrapper } from "./variants";

export type RadioGroupItemProps = Omit<
  React.ComponentPropsWithoutRef<"span">,
  "defaultChecked" | "onChange"
> &
  VariantProps<typeof radioWrapper> &
  VariantProps<typeof radioControl> & {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    form?: string;
    id?: string;
    name?: string;
    nativeButton?: boolean;
    onCheckedChange?: (
      checked: boolean,
      details: import("@starwind-ui/react/radio").RadioCheckedChangeDetails,
    ) => void;
    readOnly?: boolean;
    ref?: React.Ref<HTMLSpanElement | HTMLButtonElement>;
    required?: boolean;
    value: string;
    icon?: React.ReactNode;
  };

function RadioGroupItem(props: RadioGroupItemProps) {
  const {
    variant,
    size = "md",
    checked,
    defaultChecked,
    disabled = false,
    form,
    id,
    name,
    nativeButton = false,
    onCheckedChange,
    readOnly = false,
    ref,
    required = false,
    value,
    className,
    icon,
    ...rest
  } = props;

  return (
    <div className={radioWrapper({ size })} data-slot="radio-group-item-wrapper">
      <RadioPrimitive.Root
        className={radioItem()}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        form={form}
        id={id}
        name={name}
        nativeButton={nativeButton}
        onCheckedChange={onCheckedChange}
        readOnly={readOnly}
        ref={ref}
        required={required}
        value={value}
        {...rest}
        data-slot="radio-group-item"
      >
        <span
          className={radioControl({ variant, class: className })}
          data-slot="radio-group-item-control"
        >
          <RadioPrimitive.Indicator
            className={radioIndicator({ size })}
            data-slot="radio-group-item-indicator"
          >
            {icon ?? <CircleFilled />}
          </RadioPrimitive.Indicator>
        </span>
      </RadioPrimitive.Root>
    </div>
  );
}

export default RadioGroupItem;
