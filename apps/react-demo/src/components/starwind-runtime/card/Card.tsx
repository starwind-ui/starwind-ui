import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { card } from "./variants";

export type CardProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof card> & {
    ref?: React.Ref<HTMLDivElement>;
  };

function Card(props: CardProps) {
  const { variant, size = "md", ref, className, children, ...rest } = props;

  return (
    <div
      data-sw-card
      className={card({ variant, size, class: className })}
      {...rest}
      data-size={size}
      ref={ref}
      data-slot="card"
    >
      {children}
    </div>
  );
}

export default Card;
