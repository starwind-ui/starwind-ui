import type * as React from "react";
import { breadcrumbLink } from "./variants";

export type BreadcrumbLinkProps = React.ComponentPropsWithoutRef<"a"> & {
  asChild?: boolean;
  ref?: React.Ref<HTMLAnchorElement>;
};

function BreadcrumbLink(props: BreadcrumbLinkProps) {
  const { asChild = false, ref, className, children, ...rest } = props;

  if (asChild) {
    return children;
  }

  return (
    <a
      data-sw-breadcrumb-link
      className={breadcrumbLink({ class: className })}
      {...rest}
      ref={ref}
      data-slot="breadcrumb-link"
    >
      {children}
    </a>
  );
}

export default BreadcrumbLink;
