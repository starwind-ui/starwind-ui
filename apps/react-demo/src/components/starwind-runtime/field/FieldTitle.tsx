import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { fieldTitle } from "./variants";

export type FieldTitleProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof fieldTitle> & {
    ref?: React.Ref<HTMLDivElement>;
  };

function FieldTitle(props: FieldTitleProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div className={fieldTitle({ class: className })} ref={ref} {...rest} data-slot="field-title">
      {children}
    </div>
  );
}

export default FieldTitle;
