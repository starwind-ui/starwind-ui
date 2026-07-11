import ComboboxPrimitive from "@starwind-ui/react/combobox";
import { IconChevronDown as ChevronDown, IconX as X } from "@tabler/icons-react";
import type * as React from "react";
import { InputGroup, InputGroupAddon, InputGroupButton } from "../input-group";
import { comboboxInput, comboboxInputGroup } from "./variants";

export type ComboboxInputProps = React.ComponentPropsWithoutRef<"input"> & {
  children?: React.ReactNode;
  showClear?: boolean;
  showTrigger?: boolean;
};

function ComboboxInput(props: ComboboxInputProps) {
  const {
    className,
    disabled = false,
    showClear = false,
    showTrigger = true,
    children,
    ...rest
  } = props;

  return (
    <InputGroup
      className={comboboxInputGroup({ class: className })}
      data-sw-combobox-input-group=""
    >
      <ComboboxPrimitive.Input
        className={comboboxInput()}
        disabled={disabled}
        {...rest}
        data-slot="combobox-input"
      />

      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <ComboboxPrimitive.Trigger
            asChild={true}
            disabled={disabled}
            data-slot="combobox-trigger"
          >
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              disabled={disabled}
              className="group-has-data-[slot=combobox-clear]/input-group:hidden"
              data-slot="combobox-trigger"
            >
              <ChevronDown className="text-muted-foreground pointer-events-none size-4" />
            </InputGroupButton>
          </ComboboxPrimitive.Trigger>
        )}

        {showClear && (
          <ComboboxPrimitive.Clear
            asChild={true}
            disabled={disabled}
            aria-label="Clear selection"
            data-slot="combobox-clear"
          >
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              disabled={disabled}
              data-slot="combobox-clear"
            >
              <X className="text-muted-foreground pointer-events-none size-4" />
            </InputGroupButton>
          </ComboboxPrimitive.Clear>
        )}
      </InputGroupAddon>

      {children}
    </InputGroup>
  );
}

export default ComboboxInput;
