import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { comboboxSeparator } from "./variants";

export type ComboboxSeparatorProps = React.ComponentPropsWithoutRef<"div">;

function ComboboxSeparator(props: ComboboxSeparatorProps) {
  const { className, ...rest } = props;

  return (
    <ComboboxPrimitive.Separator
      className={comboboxSeparator({ class: className })}
      {...rest}
      data-slot="combobox-separator"
    />
  );
}

export default ComboboxSeparator;
