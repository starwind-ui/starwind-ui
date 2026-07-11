import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { InputGroup } from "../input-group";
import { comboboxInputGroup } from "./variants";

export type ComboboxInputGroupProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof comboboxInputGroup>;

function ComboboxInputGroup(props: ComboboxInputGroupProps) {
  const { className, size = "md", children, ...rest } = props;

  return (
    <InputGroup
      className={comboboxInputGroup({ size, class: className })}
      {...rest}
      data-sw-combobox-input-group=""
      data-slot="combobox-input-group"
    >
      {children}
    </InputGroup>
  );
}

export default ComboboxInputGroup;
