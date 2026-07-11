import type * as React from "react";
import { cardAction } from "./variants";

export type CardActionProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function CardAction(props: CardActionProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      data-sw-card-action
      className={cardAction({ class: className })}
      {...rest}
      ref={ref}
      data-slot="card-action"
    >
      {children}
    </div>
  );
}

export default CardAction;
