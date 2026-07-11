import type * as React from "react";
import { inputGroupText } from "./variants";

export type InputGroupTextProps = React.ComponentPropsWithoutRef<"span">;

function InputGroupText(props: InputGroupTextProps) {
  const { className, children, ...rest } = props;

  return (
    <span className={inputGroupText({ class: className })} {...rest}>
      {children}
    </span>
  );
}

export default InputGroupText;
