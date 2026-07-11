import SelectPrimitive from "@starwind-ui/react/select";
import { IconChevronDown as ChevronDown } from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { selectTrigger, selectValue } from "./variants";

export type SelectTriggerProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof selectTrigger> & {
    asChild?: boolean;
    iconClass?: string;
    placeholder?: string;
    showIcon?: boolean;
    valueClass?: string;
    icon?: React.ReactNode;
  };

function SelectTrigger(props: SelectTriggerProps) {
  const {
    asChild = false,
    className,
    iconClass: iconClassName,
    placeholder,
    showIcon = true,
    size = "md",
    valueClass: valueClassName,
    children,
    icon,
    ...rest
  } = props;

  return (
    <SelectPrimitive.Trigger
      className={selectTrigger({ size, class: className })}
      asChild={asChild}
      {...rest}
      data-slot="select-trigger"
    >
      {children ?? (
        <SelectPrimitive.Value
          className={selectValue({ class: valueClassName })}
          placeholder={placeholder}
          data-slot="select-value"
        />
      )}

      {!asChild && showIcon && (
        <SelectPrimitive.Icon
          className={["text-muted-foreground pointer-events-none size-4", iconClassName]
            .filter(Boolean)
            .join(" ")}
          data-slot="select-icon"
        >
          {icon ?? <ChevronDown />}
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  );
}

export default SelectTrigger;
