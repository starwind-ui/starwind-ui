import type * as React from "react";
import { tableHead } from "./variants";

export type TableHeadProps = React.ComponentPropsWithoutRef<"th"> & {
  ref?: React.Ref<HTMLTableCellElement>;
};

function TableHead(props: TableHeadProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <th className={tableHead({ class: className })} {...rest} ref={ref} data-slot="table-head">
      {children}
    </th>
  );
}

export default TableHead;
