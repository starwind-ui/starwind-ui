import type * as React from "react";
import { inputGroup } from "./variants";

export type InputGroupProps = React.ComponentPropsWithoutRef<"div">;

function InputGroup(props: InputGroupProps) {
  const { className, children, ...rest } = props;

  return (
    <div
      role="group"
      className={inputGroup({ class: className })}
      data-slot="input-group"
      {...rest}
    >
      {children}
    </div>
  );
}

export default InputGroup;
