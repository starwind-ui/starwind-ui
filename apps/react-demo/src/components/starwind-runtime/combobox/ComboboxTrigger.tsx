import ComboboxPrimitive from "@starwind-ui/react/combobox";
import { IconChevronDown as ChevronDown } from "@tabler/icons-react";
import type * as React from "react";
import { comboboxTrigger } from "./variants";

export type ComboboxTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  iconClass?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
};

function ComboboxTrigger(props: ComboboxTriggerProps) {
  const {
    asChild = false,
    className,
    iconClass: iconClassName,
    showIcon = true,
    children,
    icon,
    ...rest
  } = props;

  return (
    <ComboboxPrimitive.Trigger
      className={comboboxTrigger({ class: className })}
      asChild={asChild}
      {...rest}
      data-slot="combobox-trigger"
    >
      {children}

      {!asChild &&
        showIcon &&
        (icon ?? (
          <ChevronDown
            className={["text-muted-foreground pointer-events-none size-4", iconClassName]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
    </ComboboxPrimitive.Trigger>
  );
}

export default ComboboxTrigger;
