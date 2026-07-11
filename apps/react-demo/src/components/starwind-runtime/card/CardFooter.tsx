import type * as React from "react";
import { cardFooter } from "./variants";

export type CardFooterProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function CardFooter(props: CardFooterProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      data-sw-card-footer
      className={cardFooter({ class: className })}
      {...rest}
      ref={ref}
      data-slot="card-footer"
    >
      {children}
    </div>
  );
}

export default CardFooter;
