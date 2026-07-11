import FieldPrimitive from "@starwind-ui/react/field";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { fieldValidity } from "./variants";

export type FieldValidityProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof fieldValidity> & {
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
    ref?: React.Ref<HTMLDivElement>;
  };

function FieldValidity(props: FieldValidityProps) {
  const { match, ref, className, children, ...rest } = props;

  return (
    <FieldPrimitive.Validity
      className={fieldValidity({ class: className })}
      match={match}
      ref={ref}
      {...rest}
      data-slot="field-validity"
    >
      {children}
    </FieldPrimitive.Validity>
  );
}

export default FieldValidity;
