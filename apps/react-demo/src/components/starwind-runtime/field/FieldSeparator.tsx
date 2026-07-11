import type * as React from "react";
import { Separator } from "../separator";
import { fieldSeparator, fieldSeparatorContent } from "./variants";

export type FieldSeparatorProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function FieldSeparator(props: FieldSeparatorProps) {
  const { ref, className, children, ...rest } = props;

  const hasContent = Boolean(children);

  return (
    <div
      className={fieldSeparator({ class: className })}
      data-content={hasContent}
      {...rest}
      ref={ref}
      data-slot="field-separator"
    >
      <Separator className="absolute inset-0 top-1/2" />

      {hasContent && (
        <span className={fieldSeparatorContent()} data-slot="field-separator-content">
          {children}
        </span>
      )}
    </div>
  );
}

export default FieldSeparator;
