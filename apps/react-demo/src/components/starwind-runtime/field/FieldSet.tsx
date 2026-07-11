import FieldsetPrimitive from "@starwind-ui/react/fieldset";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { fieldSet } from "./variants";

export type FieldSetProps = React.ComponentPropsWithoutRef<"fieldset"> &
  VariantProps<typeof fieldSet> & {
    disabled?: boolean;
    ref?: React.Ref<HTMLFieldSetElement>;
  };

function FieldSet(props: FieldSetProps) {
  const { disabled = false, ref, className, children, ...rest } = props;

  return (
    <FieldsetPrimitive.Root
      className={fieldSet({ class: className })}
      disabled={disabled}
      ref={ref}
      {...rest}
      data-slot="field-set"
    >
      {children}
    </FieldsetPrimitive.Root>
  );
}

export default FieldSet;
