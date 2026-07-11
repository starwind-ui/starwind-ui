import type * as React from "react";
import { cardTitle } from "./variants";

export type CardTitleProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function CardTitle(props: CardTitleProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      data-sw-card-title
      className={cardTitle({ class: className })}
      {...rest}
      ref={ref}
      data-slot="card-title"
    >
      {children}
    </div>
  );
}

export default CardTitle;
