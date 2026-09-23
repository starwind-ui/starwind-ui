"use client";

import FormPrimitive from "@starwind-ui/react/form";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { form } from "./variants";

export type FormProps = React.ComponentPropsWithoutRef<"form"> &
  VariantProps<typeof form> & {
    options?: import("@starwind-ui/react/form").FormOptions;
    errors?: import("@starwind-ui/react/form").FormExternalErrors;
    errorOptions?: import("@starwind-ui/react/form").FormExternalErrorOptions;
    errorVisibility?: import("@starwind-ui/react/form").FormValidationTiming;
    revalidationTiming?: import("@starwind-ui/react/form").FormValidationTiming;
    ref?: React.Ref<HTMLFormElement>;
    validationTiming?: import("@starwind-ui/react/form").FormValidationTiming;
  };

function Form(props: FormProps) {
  const {
    options,
    errors,
    errorOptions,
    errorVisibility,
    revalidationTiming,
    ref,
    validationTiming,
    className,
    children,
    ...rest
  } = props;

  return (
    <FormPrimitive.Root
      options={options}
      errors={errors}
      errorOptions={errorOptions}
      className={form({ class: className })}
      errorVisibility={errorVisibility}
      ref={ref}
      revalidationTiming={revalidationTiming}
      validationTiming={validationTiming}
      {...rest}
      data-slot="form"
    >
      {children}
    </FormPrimitive.Root>
  );
}

export default Form;
