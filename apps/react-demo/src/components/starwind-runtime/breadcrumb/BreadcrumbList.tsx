import type * as React from "react";
import { breadcrumbList } from "./variants";

export type BreadcrumbListProps = React.ComponentPropsWithoutRef<"ol"> & {
  ref?: React.Ref<HTMLOListElement>;
};

function BreadcrumbList(props: BreadcrumbListProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <ol
      data-sw-breadcrumb-list
      className={breadcrumbList({ class: className })}
      {...rest}
      ref={ref}
      data-slot="breadcrumb-list"
    >
      {children}
    </ol>
  );
}

export default BreadcrumbList;
