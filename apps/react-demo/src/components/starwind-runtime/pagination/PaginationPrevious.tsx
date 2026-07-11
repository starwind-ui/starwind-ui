import { IconChevronLeft as ChevronLeft } from "@tabler/icons-react";
import type * as React from "react";
import PaginationLink from "./PaginationLink";
import { paginationPrevious } from "./variants";

export type PaginationPreviousProps = React.ComponentProps<typeof PaginationLink> & {
  icon?: React.ReactNode;
};

function PaginationPrevious(props: PaginationPreviousProps) {
  const { size = "md", ref, className, children, icon, ...rest } = props;

  return (
    <PaginationLink
      aria-label="Go to previous page"
      size={size}
      className={paginationPrevious({ class: className })}
      {...rest}
      ref={ref}
      data-slot="pagination-previous"
    >
      {icon ?? <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-1" />}

      {children}
    </PaginationLink>
  );
}

export default PaginationPrevious;
