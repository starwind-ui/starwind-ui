import SelectPrimitive from "@starwind-ui/react/select";
import { IconCheck as Check } from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { selectItem, selectItemIndicator, selectItemText } from "./variants";

export type SelectItemProps = Omit<React.ComponentPropsWithoutRef<"div">, "role"> &
  VariantProps<typeof selectItem> & {
    disabled?: boolean;
    indicatorClass?: string;
    showIndicator?: boolean;
    value: string;
    indicator?: React.ReactNode;
  };

function SelectItem(props: SelectItemProps) {
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
    <SelectPrimitive.Item
      className={selectItem({ inset, disabled, class: className })}
      disabled={disabled}
      value={value}
      {...rest}
      data-slot="select-item"
    >
      <SelectPrimitive.ItemText className={selectItemText()} data-slot="select-item-text">
        {children}
      </SelectPrimitive.ItemText>

      {showIndicator && (
        <SelectPrimitive.ItemIndicator
          className={selectItemIndicator({ class: indicatorClassName })}
          data-slot="select-item-indicator"
        >
          {indicator ?? <Check className="size-4" />}
        </SelectPrimitive.ItemIndicator>
      )}
    </SelectPrimitive.Item>
  );
}

export default SelectItem;
