import { IconDots as Dots } from "@tabler/icons-react";
import type * as React from "react";
import { breadcrumbEllipsis } from "./variants";

export type BreadcrumbEllipsisProps = React.ComponentPropsWithoutRef<"span"> & {
  ref?: React.Ref<HTMLSpanElement>;
  icon?: React.ReactNode;
};

function BreadcrumbEllipsis(props: BreadcrumbEllipsisProps) {
  const { ref, className, children, icon, ...rest } = props;

  return (
    <span
      data-sw-breadcrumb-ellipsis
      role="presentation"
      aria-hidden="true"
      className={breadcrumbEllipsis({ class: className })}
      {...rest}
      ref={ref}
      data-slot="breadcrumb-ellipsis"
    >
      {icon ?? <Dots />}

      {children ?? <span className="sr-only">More</span>}
    </span>
  );
}

export default BreadcrumbEllipsis;
