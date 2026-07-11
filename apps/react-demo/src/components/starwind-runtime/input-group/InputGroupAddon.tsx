import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { inputGroupAddon } from "./variants";

export type InputGroupAddonProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof inputGroupAddon>;

function InputGroupAddon(props: InputGroupAddonProps) {
  const { align, className, children, ...rest } = props;

  return (
    <div
      role="group"
      data-align={align}
      className={inputGroupAddon({ align, class: className })}
      {...rest}
      data-slot="input-group-addon"
    >
      {children}
    </div>
  );
}

export default InputGroupAddon;
