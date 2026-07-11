import type * as React from "react";
import { itemContent } from "./variants";

export type ItemContentProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ItemContent(props: ItemContentProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div className={itemContent({ class: className })} {...rest} ref={ref} data-slot="item-content">
      {children}
    </div>
  );
}

export default ItemContent;
