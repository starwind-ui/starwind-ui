import FieldPrimitive from "@starwind-ui/react/field";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { fieldLabel } from "./variants";

export type FieldLabelProps = React.ComponentPropsWithoutRef<"label"> &
  VariantProps<typeof fieldLabel> & {
    ref?: React.Ref<HTMLLabelElement>;
  };

function FieldLabel(props: FieldLabelProps) {
  const { size, ref, className, children, ...rest } = props;

  return (
    <FieldPrimitive.Label
      className={fieldLabel({ size, class: className })}
      ref={ref}
      {...rest}
      data-slot="field-label"
    >
      {children}
    </FieldPrimitive.Label>
  );
}

export default FieldLabel;
