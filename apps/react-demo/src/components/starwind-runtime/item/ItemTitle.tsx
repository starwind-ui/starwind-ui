import type * as React from "react";
import { itemTitle } from "./variants";

export type ItemTitleProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ItemTitle(props: ItemTitleProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div className={itemTitle({ class: className })} {...rest} ref={ref} data-slot="item-title">
      {children}
    </div>
  );
}

export default ItemTitle;
