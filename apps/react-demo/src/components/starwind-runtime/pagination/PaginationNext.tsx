import { IconChevronRight as ChevronRight } from "@tabler/icons-react";
import type * as React from "react";
import PaginationLink from "./PaginationLink";
import { paginationNext } from "./variants";

export type PaginationNextProps = React.ComponentProps<typeof PaginationLink> & {
  icon?: React.ReactNode;
};

function PaginationNext(props: PaginationNextProps) {
  const { size = "md", ref, className, children, icon, ...rest } = props;

  return (
    <PaginationLink
      aria-label="Go to next page"
      size={size}
      className={paginationNext({ class: className })}
      {...rest}
      ref={ref}
      data-slot="pagination-next"
    >
      {children}

      {icon ?? <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />}
    </PaginationLink>
  );
}

export default PaginationNext;
