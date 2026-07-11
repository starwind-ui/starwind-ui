import FieldPrimitive from "@starwind-ui/react/field";
import type * as React from "react";
import { fieldError } from "./variants";

export type FieldErrorProps = React.ComponentPropsWithoutRef<"div"> & {
  match?:
    | boolean
    | "badInput"
    | "customError"
    | "patternMismatch"
    | "rangeOverflow"
    | "rangeUnderflow"
    | "stepMismatch"
    | "tooLong"
    | "tooShort"
    | "typeMismatch"
    | "valid"
    | "valueMissing";
  messageSource?: "children" | "validation";
  ref?: React.Ref<HTMLDivElement>;
};

function FieldError(props: FieldErrorProps) {
  const { match, messageSource, ref, className, children, ...rest } = props;

  return (
    <FieldPrimitive.Error
      className={fieldError({ class: className })}
      match={match}
      messageSource={messageSource}
      ref={ref}
      {...rest}
      data-slot="field-error"
    >
      {children}
    </FieldPrimitive.Error>
  );
}

export default FieldError;
