import FieldsetPrimitive from "@starwind-ui/react/fieldset";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { fieldLegend } from "./variants";

export type FieldLegendProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof fieldLegend> & {
    ref?: React.Ref<HTMLDivElement>;
  };

function FieldLegend(props: FieldLegendProps) {
  const { variant, ref, className, children, ...rest } = props;

  return (
    <FieldsetPrimitive.Legend
      className={fieldLegend({ variant, class: className })}
      ref={ref}
      {...rest}
      data-slot="field-legend"
    >
      {children}
    </FieldsetPrimitive.Legend>
  );
}

export default FieldLegend;
