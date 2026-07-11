import FieldPrimitive from "@starwind-ui/react/field";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { field } from "./variants";

export type FieldProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof field> & {
    dirty?: boolean;
    disabled?: boolean;
    errorVisibility?: import("@starwind-ui/react/form").FormValidationTiming;
    invalid?: boolean;
    name?: string;
    revalidationTiming?: import("@starwind-ui/react/form").FormValidationTiming;
    touched?: boolean;
    validationTiming?: import("@starwind-ui/react/form").FormValidationTiming;
    ref?: React.Ref<HTMLDivElement>;
  };

function Field(props: FieldProps) {
  const {
    dirty,
    disabled = false,
    errorVisibility,
    invalid,
    name,
    orientation,
    revalidationTiming,
    touched,
    validationTiming,
    ref,
    className,
    children,
    ...rest
  } = props;

  return (
    <FieldPrimitive.Root
      className={field({ orientation, class: className })}
      dirty={dirty}
      disabled={disabled}
      errorVisibility={errorVisibility}
      invalid={invalid}
      name={name}
      revalidationTiming={revalidationTiming}
      touched={touched}
      validationTiming={validationTiming}
      ref={ref}
      {...rest}
      data-slot="field"
    >
      {children}
    </FieldPrimitive.Root>
  );
}

export default Field;
