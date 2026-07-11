import type * as React from "react";
import { breadcrumbItem } from "./variants";

export type BreadcrumbItemProps = React.ComponentPropsWithoutRef<"li"> & {
  ref?: React.Ref<HTMLLIElement>;
};

function BreadcrumbItem(props: BreadcrumbItemProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <li
      data-sw-breadcrumb-item
      className={breadcrumbItem({ class: className })}
      {...rest}
      ref={ref}
      data-slot="breadcrumb-item"
    >
      {children}
    </li>
  );
}

export default BreadcrumbItem;
