import FormPrimitive from "@starwind-ui/react/form";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { form } from "./variants";

export type FormProps = React.ComponentPropsWithoutRef<"form"> &
  VariantProps<typeof form> & {
    errorVisibility?: import("@starwind-ui/react/form").FormValidationTiming;
    revalidationTiming?: import("@starwind-ui/react/form").FormValidationTiming;
    ref?: React.Ref<HTMLFormElement>;
    validationTiming?: import("@starwind-ui/react/form").FormValidationTiming;
  };

function Form(props: FormProps) {
  const {
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
