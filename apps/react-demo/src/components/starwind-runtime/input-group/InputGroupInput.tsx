import type * as React from "react";
import { Input } from "../input";
import { inputGroupInput } from "./variants";

export type InputGroupInputProps = React.ComponentProps<typeof Input>;

function InputGroupInput(props: InputGroupInputProps) {
  const { className, ...rest } = props;

  return (
    <Input
      className={inputGroupInput({ class: className })}
      {...rest}
      data-slot="input-group-control"
    />
  );
}

export default InputGroupInput;
