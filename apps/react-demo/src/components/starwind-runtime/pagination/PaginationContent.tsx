import type * as React from "react";
import { paginationContent } from "./variants";

export type PaginationContentProps = React.ComponentPropsWithoutRef<"ul"> & {
  ref?: React.Ref<HTMLUListElement>;
};

function PaginationContent(props: PaginationContentProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <ul
      className={paginationContent({ class: className })}
      {...rest}
      ref={ref}
      data-slot="pagination-content"
    >
      {children}
    </ul>
  );
}

export default PaginationContent;
