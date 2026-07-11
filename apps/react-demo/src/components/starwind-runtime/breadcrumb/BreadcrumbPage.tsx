import type * as React from "react";
import { breadcrumbPage } from "./variants";

export type BreadcrumbPageProps = React.ComponentPropsWithoutRef<"span"> & {
  ref?: React.Ref<HTMLSpanElement>;
};

function BreadcrumbPage(props: BreadcrumbPageProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <span
      data-sw-breadcrumb-page
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={breadcrumbPage({ class: className })}
      {...rest}
      ref={ref}
      data-slot="breadcrumb-page"
    >
      {children}
    </span>
  );
}

export default BreadcrumbPage;
