import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { label } from "./variants";

export type LabelProps = React.ComponentPropsWithoutRef<"label"> &
  VariantProps<typeof label> & {
    ref?: React.Ref<HTMLLabelElement>;
  };

function Label(props: LabelProps) {
  const { size, ref, className, children, ...rest } = props;

  return (
    <label
      data-sw-label
      className={label({ size, class: className })}
      {...rest}
      ref={ref}
      data-slot="label"
    >
      {children}
    </label>
  );
}

export default Label;
