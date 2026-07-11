import type * as React from "react";
import { Separator } from "../separator";
import { buttonGroupSeparator } from "./variants";

export type ButtonGroupSeparatorProps = React.ComponentProps<typeof Separator>;

function ButtonGroupSeparator(props: ButtonGroupSeparatorProps) {
  const { orientation = "vertical", className, ...rest } = props;

  return (
    <Separator
      orientation={orientation}
      className={buttonGroupSeparator({ class: className })}
      {...rest}
      data-slot="button-group-separator"
    />
  );
}

export default ButtonGroupSeparator;
