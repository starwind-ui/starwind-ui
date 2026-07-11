import type * as React from "react";
import { cardContent } from "./variants";

export type CardContentProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function CardContent(props: CardContentProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      data-sw-card-content
      className={cardContent({ class: className })}
      {...rest}
      ref={ref}
      data-slot="card-content"
    >
      {children}
    </div>
  );
}

export default CardContent;
