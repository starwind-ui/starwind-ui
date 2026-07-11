import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { buttonGroup } from "./variants";

export type ButtonGroupProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof buttonGroup>;

function ButtonGroup(props: ButtonGroupProps) {
  const { orientation = "horizontal", className, children, ...rest } = props;

  return (
    <div
      role="group"
      data-orientation={orientation}
      className={buttonGroup({ orientation, class: className })}
      {...rest}
      data-slot="button-group"
    >
      {children}
    </div>
  );
}

export default ButtonGroup;
