import type * as React from "react";
import { Textarea } from "../textarea";
import { inputGroupTextarea } from "./variants";

export type InputGroupTextareaProps = React.ComponentProps<typeof Textarea>;

function InputGroupTextarea(props: InputGroupTextareaProps) {
  const { className, ...rest } = props;

  return (
    <Textarea
      className={inputGroupTextarea({ class: className })}
      {...rest}
      data-slot="input-group-control"
    />
  );
}

export default InputGroupTextarea;
