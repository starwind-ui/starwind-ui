import ComboboxPrimitive from "@starwind-ui/react/combobox";
import { IconX as X } from "@tabler/icons-react";
import type * as React from "react";
import { InputGroupButton } from "../input-group";
import { comboboxClear } from "./variants";

export type ComboboxClearProps = React.ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  showIcon?: boolean;
};

function ComboboxClear(props: ComboboxClearProps) {
  const {
    asChild = false,
    className,
    disabled = false,
    showIcon = true,
    children,
    ...rest
  } = props;

  if (asChild) {
    return (
      <ComboboxPrimitive.Clear
        className={comboboxClear({ class: className })}
        asChild={asChild}
        disabled={disabled}
        {...rest}
        aria-label="Clear selection"
        data-slot="combobox-clear"
      >
        {children}

        {showIcon && <X />}
      </ComboboxPrimitive.Clear>
    );
  }

  return (
    <ComboboxPrimitive.Clear
      asChild={true}
      disabled={disabled}
      {...rest}
      aria-label="Clear selection"
      data-slot="combobox-clear"
    >
      <InputGroupButton
        size="icon-sm"
        variant="ghost"
        disabled={disabled}
        className={comboboxClear({ class: className })}
        data-slot="combobox-clear"
      >
        {children}

        {showIcon && <X />}
      </InputGroupButton>
    </ComboboxPrimitive.Clear>
  );
}

export default ComboboxClear;
