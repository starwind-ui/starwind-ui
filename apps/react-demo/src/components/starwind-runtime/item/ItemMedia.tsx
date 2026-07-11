import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { itemMedia } from "./variants";

export type ItemMediaProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof itemMedia> & {
    ref?: React.Ref<HTMLDivElement>;
  };

function ItemMedia(props: ItemMediaProps) {
  const { variant = "default", ref, className, children, ...rest } = props;

  return (
    <div
      className={itemMedia({ variant, class: className })}
      data-variant={variant}
      {...rest}
      ref={ref}
      data-slot="item-media"
    >
      {children}
    </div>
  );
}

export default ItemMedia;
