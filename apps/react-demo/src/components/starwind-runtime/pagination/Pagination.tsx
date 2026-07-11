import type * as React from "react";
import { pagination } from "./variants";

export type PaginationProps = React.ComponentPropsWithoutRef<"nav"> & {
  ref?: React.Ref<HTMLElement>;
};

function Pagination(props: PaginationProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={pagination({ class: className })}
      {...rest}
      ref={ref}
      data-slot="pagination"
    >
      {children}
    </nav>
  );
}

export default Pagination;
