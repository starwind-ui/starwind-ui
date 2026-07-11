import type * as React from "react";
import { buttonGroupText } from "./variants";

export type ButtonGroupTextProps = React.ComponentPropsWithoutRef<"div">;

function ButtonGroupText(props: ButtonGroupTextProps) {
  const { className, children, ...rest } = props;

  return (
    <div className={buttonGroupText({ class: className })} {...rest} data-slot="button-group-text">
      {children}
    </div>
  );
}

export default ButtonGroupText;
