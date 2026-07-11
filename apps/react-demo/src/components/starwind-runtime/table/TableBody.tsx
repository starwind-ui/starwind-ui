import type * as React from "react";
import { tableBody } from "./variants";

export type TableBodyProps = React.ComponentPropsWithoutRef<"tbody"> & {
  ref?: React.Ref<HTMLTableSectionElement>;
};

function TableBody(props: TableBodyProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <tbody className={tableBody({ class: className })} {...rest} ref={ref} data-slot="table-body">
      {children}
    </tbody>
  );
}

export default TableBody;
