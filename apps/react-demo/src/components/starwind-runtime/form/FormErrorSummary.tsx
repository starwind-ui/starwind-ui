import FormPrimitive from "@starwind-ui/react/form";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { formErrorSummary } from "./variants";

export type FormErrorSummaryProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof formErrorSummary> & {
    ref?: React.Ref<HTMLDivElement>;
  };

function FormErrorSummary(props: FormErrorSummaryProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <FormPrimitive.ErrorSummary
      className={formErrorSummary({ class: className })}
      ref={ref}
      {...rest}
      data-slot="form-error-summary"
    >
      {children}
    </FormPrimitive.ErrorSummary>
  );
}

export default FormErrorSummary;
