import type * as React from "react";
import { itemActions } from "./variants";

export type ItemActionsProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ItemActions(props: ItemActionsProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div className={itemActions({ class: className })} {...rest} ref={ref} data-slot="item-actions">
      {children}
    </div>
  );
}

export default ItemActions;
