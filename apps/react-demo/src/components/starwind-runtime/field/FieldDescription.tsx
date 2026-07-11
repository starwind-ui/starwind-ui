import FieldPrimitive from "@starwind-ui/react/field";
import type * as React from "react";
import { fieldDescription } from "./variants";

export type FieldDescriptionProps = React.ComponentPropsWithoutRef<"p"> & {
  ref?: React.Ref<HTMLParagraphElement>;
};

function FieldDescription(props: FieldDescriptionProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <FieldPrimitive.Description
      className={fieldDescription({ class: className })}
      ref={ref}
      {...rest}
      data-slot="field-description"
    >
      {children}
    </FieldPrimitive.Description>
  );
}

export default FieldDescription;
