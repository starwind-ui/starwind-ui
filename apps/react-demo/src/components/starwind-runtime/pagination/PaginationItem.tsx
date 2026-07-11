import type * as React from "react";

export type PaginationItemProps = React.ComponentPropsWithoutRef<"li"> & {
  ref?: React.Ref<HTMLLIElement>;
};

function PaginationItem(props: PaginationItemProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <li className={className} {...rest} ref={ref} data-slot="pagination-item">
      {children}
    </li>
  );
}

export default PaginationItem;
