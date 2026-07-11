import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { Button } from "../button";
import { inputGroupButton } from "./variants";

export type InputGroupButtonProps = Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButton>;

function InputGroupButton(props: InputGroupButtonProps) {
  const { type = "button", variant = "ghost", size, className, children, ...rest } = props;

  return (
    <Button
      type={type}
      data-size={size}
      size={size}
      variant={variant}
      className={inputGroupButton({ size, class: className })}
      {...rest}
    >
      {children}
    </Button>
  );
}

export default InputGroupButton;
