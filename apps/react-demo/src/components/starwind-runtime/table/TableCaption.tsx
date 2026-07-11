import type * as React from "react";
import { tableCaption } from "./variants";

export type TableCaptionProps = React.ComponentPropsWithoutRef<"caption"> & {
  ref?: React.Ref<HTMLTableCaptionElement>;
};

function TableCaption(props: TableCaptionProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <caption
      className={tableCaption({ class: className })}
      {...rest}
      ref={ref}
      data-slot="table-caption"
    >
      {children}
    </caption>
  );
}

export default TableCaption;
