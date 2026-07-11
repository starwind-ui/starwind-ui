import type * as React from "react";
import { tableRow } from "./variants";

export type TableRowProps = React.ComponentPropsWithoutRef<"tr"> & {
  ref?: React.Ref<HTMLTableRowElement>;
};

function TableRow(props: TableRowProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <tr className={tableRow({ class: className })} {...rest} ref={ref} data-slot="table-row">
      {children}
    </tr>
  );
}

export default TableRow;
