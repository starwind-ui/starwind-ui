import type * as React from "react";
import { itemHeader } from "./variants";

export type ItemHeaderProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ItemHeader(props: ItemHeaderProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div className={itemHeader({ class: className })} {...rest} ref={ref} data-slot="item-header">
      {children}
    </div>
  );
}

export default ItemHeader;
