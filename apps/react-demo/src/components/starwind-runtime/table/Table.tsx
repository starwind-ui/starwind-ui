import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { table } from "./variants";

export type TableProps = React.ComponentPropsWithoutRef<"table"> &
  VariantProps<typeof table> & {
    ref?: React.Ref<HTMLTableElement>;
  };

function Table(props: TableProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table className={table({ class: className })} {...rest} ref={ref} data-slot="table">
        {children}
      </table>
    </div>
  );
}

export default Table;
