import type * as React from "react";
import { tableHeader } from "./variants";

export type TableHeaderProps = React.ComponentPropsWithoutRef<"thead"> & {
  ref?: React.Ref<HTMLTableSectionElement>;
};

function TableHeader(props: TableHeaderProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <thead
      className={tableHeader({ class: className })}
      {...rest}
      ref={ref}
      data-slot="table-header"
    >
      {children}
    </thead>
  );
}

export default TableHeader;
