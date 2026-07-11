import type * as React from "react";
import { itemFooter } from "./variants";

export type ItemFooterProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ItemFooter(props: ItemFooterProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div className={itemFooter({ class: className })} {...rest} ref={ref} data-slot="item-footer">
      {children}
    </div>
  );
}

export default ItemFooter;
