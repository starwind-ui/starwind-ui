import type * as React from "react";
import { itemGroup } from "./variants";

export type ItemGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ItemGroup(props: ItemGroupProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      role="list"
      className={itemGroup({ class: className })}
      {...rest}
      ref={ref}
      data-slot="item-group"
    >
      {children}
    </div>
  );
}

export default ItemGroup;
