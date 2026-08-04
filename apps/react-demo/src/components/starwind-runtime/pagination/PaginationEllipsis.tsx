import { IconDots as Dots } from "@tabler/icons-react";
import type * as React from "react";
import { paginationEllipsis } from "./variants";

export type PaginationEllipsisProps = React.ComponentPropsWithoutRef<"span"> & {
  ref?: React.Ref<HTMLSpanElement>;
  icon?: React.ReactNode;
};

function PaginationEllipsis(props: PaginationEllipsisProps) {
  const { ref, className, children, icon, ...rest } = props;

  return (
    <span
      aria-hidden
      className={paginationEllipsis({ class: className })}
      {...rest}
      ref={ref}
      data-slot="pagination-ellipsis"
    >
      {icon ?? <Dots className="size-4" />}

      {children ?? <span className="sr-only">More pages</span>}
    </span>
  );
}

export default PaginationEllipsis;
