import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { fieldContent } from "./variants";

export type FieldContentProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof fieldContent> & {
    ref?: React.Ref<HTMLDivElement>;
  };

function FieldContent(props: FieldContentProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      className={fieldContent({ class: className })}
      ref={ref}
      {...rest}
      data-slot="field-content"
    >
      {children}
    </div>
  );
}

export default FieldContent;
