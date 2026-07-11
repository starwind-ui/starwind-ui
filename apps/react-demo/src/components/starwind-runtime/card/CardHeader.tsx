import type * as React from "react";
import { cardHeader } from "./variants";

export type CardHeaderProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function CardHeader(props: CardHeaderProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      data-sw-card-header
      className={cardHeader({ class: className })}
      {...rest}
      ref={ref}
      data-slot="card-header"
    >
      {children}
    </div>
  );
}

export default CardHeader;
