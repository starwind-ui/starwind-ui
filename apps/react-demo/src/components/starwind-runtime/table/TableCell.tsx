import type * as React from "react";
import { tableCell } from "./variants";

export type TableCellProps = React.ComponentPropsWithoutRef<"td"> & {
  ref?: React.Ref<HTMLTableCellElement>;
};

function TableCell(props: TableCellProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <td className={tableCell({ class: className })} {...rest} ref={ref} data-slot="table-cell">
      {children}
    </td>
  );
}

export default TableCell;
