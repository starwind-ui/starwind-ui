import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { item } from "./variants";

export type ItemProps = React.ComponentPropsWithoutRef<"div"> &
  Omit<React.ComponentPropsWithoutRef<"a">, "type"> &
  VariantProps<typeof item> & {
    as?: React.ElementType;
    ref?: React.Ref<HTMLElement>;
  };

function Item(props: ItemProps) {
  const {
    variant = "default",
    size = "default",
    as: Tag = "div",
    ref,
    className,
    children,
    ...rest
  } = props;

  return (
    <Tag
      data-sw-item
      className={item({ variant, size, class: className })}
      {...rest}
      ref={ref}
      data-slot="item"
    >
      {children}
    </Tag>
  );
}

export default Item;
