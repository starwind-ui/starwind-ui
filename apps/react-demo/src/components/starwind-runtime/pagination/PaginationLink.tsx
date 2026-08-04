import type * as React from "react";
import { Button } from "../button";
import { paginationLink } from "./variants";

export type PaginationLinkProps = Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "as" | "ref"
> & {
  isActive?: boolean;
  ref?: React.Ref<HTMLAnchorElement>;
};

function PaginationLink(props: PaginationLinkProps) {
  const {
    isActive,
    "data-slot": dataSlot = "pagination-link",
    ref,
    className,
    children,
    ...rest
  } = props;

  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      variant={isActive ? "outline" : "ghost"}
      size="md"
      className={paginationLink({ class: className })}
      {...rest}
      as="a"
      ref={ref}
      data-slot={dataSlot}
    >
      {children}
    </Button>
  );
}

export default PaginationLink;
