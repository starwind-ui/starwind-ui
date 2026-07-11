import type * as React from "react";
import { itemDescription } from "./variants";

export type ItemDescriptionProps = React.ComponentPropsWithoutRef<"p"> & {
  ref?: React.Ref<HTMLParagraphElement>;
};

function ItemDescription(props: ItemDescriptionProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <p
      className={itemDescription({ class: className })}
      {...rest}
      ref={ref}
      data-slot="item-description"
    >
      {children}
    </p>
  );
}

export default ItemDescription;
