import { IconChevronRight as ChevronRight } from "@tabler/icons-react";
import type * as React from "react";
import { breadcrumbSeparator } from "./variants";

export type BreadcrumbSeparatorProps = React.ComponentPropsWithoutRef<"li"> & {
  ref?: React.Ref<HTMLLIElement>;
};

function BreadcrumbSeparator(props: BreadcrumbSeparatorProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <li
      data-sw-breadcrumb-separator
      role="presentation"
      aria-hidden="true"
      className={breadcrumbSeparator({ class: className })}
      {...rest}
      ref={ref}
      data-slot="breadcrumb-separator"
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

export default BreadcrumbSeparator;
