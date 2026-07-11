import ComboboxPrimitive from "@starwind-ui/react/combobox";
import { IconCheck as Check } from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { comboboxItem, comboboxItemIndicator, comboboxItemText } from "./variants";

export type ComboboxItemProps = Omit<React.ComponentPropsWithoutRef<"div">, "role"> &
  VariantProps<typeof comboboxItem> & {
    disabled?: boolean;
    indicatorClass?: string;
    showIndicator?: boolean;
    value: string;
    indicator?: React.ReactNode;
  };

function ComboboxItem(props: ComboboxItemProps) {
  const {
    className,
    disabled = false,
    indicatorClass: indicatorClassName,
    inset = false,
    showIndicator = true,
    value,
    children,
    indicator,
    ...rest
  } = props;

  return (
    <ComboboxPrimitive.Item
      className={comboboxItem({ inset, disabled, class: className })}
      disabled={disabled}
      value={value}
      {...rest}
      data-slot="combobox-item"
    >
      <ComboboxPrimitive.ItemText className={comboboxItemText()} data-slot="combobox-item-text">
        {children}
      </ComboboxPrimitive.ItemText>

      {showIndicator && (
        <ComboboxPrimitive.ItemIndicator
          className={comboboxItemIndicator({ class: indicatorClassName })}
          data-slot="combobox-item-indicator"
        >
          {indicator ?? <Check className="size-4" />}
        </ComboboxPrimitive.ItemIndicator>
      )}
    </ComboboxPrimitive.Item>
  );
}

export default ComboboxItem;
