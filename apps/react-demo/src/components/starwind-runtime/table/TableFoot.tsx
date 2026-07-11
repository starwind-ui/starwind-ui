import type * as React from "react";
import { tableFoot } from "./variants";

export type TableFootProps = React.ComponentPropsWithoutRef<"tfoot"> & {
  ref?: React.Ref<HTMLTableSectionElement>;
};

function TableFoot(props: TableFootProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <tfoot className={tableFoot({ class: className })} {...rest} ref={ref} data-slot="table-foot">
      {children}
    </tfoot>
  );
}

export default TableFoot;
