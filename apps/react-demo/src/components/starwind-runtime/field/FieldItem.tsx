import FieldPrimitive from "@starwind-ui/react/field";
import type * as React from "react";
import { fieldItem } from "./variants";

export type FieldItemProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function FieldItem(props: FieldItemProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <FieldPrimitive.Item
      className={fieldItem({ class: className })}
      ref={ref}
      {...rest}
      data-slot="field-item"
    >
      {children}
    </FieldPrimitive.Item>
  );
}

export default FieldItem;
