import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { fieldGroup } from "./variants";

export type FieldGroupProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof fieldGroup> & {
    ref?: React.Ref<HTMLDivElement>;
  };

function FieldGroup(props: FieldGroupProps) {
  const { variant = "default", ref, className, children, ...rest } = props;

  return (
    <div
      className={fieldGroup({ variant, class: className })}
      data-variant={variant}
      ref={ref}
      {...rest}
      data-slot="field-group"
    >
      {children}
    </div>
  );
}

export default FieldGroup;
