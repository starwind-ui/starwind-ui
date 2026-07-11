import type * as React from "react";
import { Separator } from "../separator";
import { itemSeparator } from "./variants";

export type ItemSeparatorProps = React.ComponentProps<typeof Separator>;

function ItemSeparator(props: ItemSeparatorProps) {
  const { orientation = "horizontal", className, ...rest } = props;

  return (
    <Separator
      orientation={orientation}
      className={itemSeparator({ class: className })}
      {...rest}
      data-slot="item-separator"
    />
  );
}

export default ItemSeparator;
