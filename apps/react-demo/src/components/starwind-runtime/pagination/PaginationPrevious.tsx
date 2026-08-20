import { IconChevronLeft as ChevronLeft } from "@tabler/icons-react";
import type * as React from "react";
import PaginationLink from "./PaginationLink";

export type PaginationPreviousProps = React.ComponentProps<typeof PaginationLink> & {
  icon?: React.ReactNode;
};

function PaginationPrevious(props: PaginationPreviousProps) {
  const { size = "md", ref, className, children, icon, ...rest } = props;

  return (
    <PaginationLink
      aria-label="Go to previous page"
      size={size}
      className={className}
      {...rest}
      ref={ref}
      data-slot="pagination-previous"
    >
      {icon ?? <ChevronLeft />}

      {children}
    </PaginationLink>
  );
}

export default PaginationPrevious;
