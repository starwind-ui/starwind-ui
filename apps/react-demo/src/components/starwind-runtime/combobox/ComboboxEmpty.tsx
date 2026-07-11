import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { comboboxEmpty } from "./variants";

export type ComboboxEmptyProps = React.ComponentPropsWithoutRef<"div">;

function ComboboxEmpty(props: ComboboxEmptyProps) {
  const { className, children, ...rest } = props;

  return (
    <ComboboxPrimitive.Empty
      className={comboboxEmpty({ class: className })}
      {...rest}
      data-slot="combobox-empty"
    >
      {children}
    </ComboboxPrimitive.Empty>
  );
}

export default ComboboxEmpty;
