import type * as React from "react";
import { cardDescription } from "./variants";

export type CardDescriptionProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function CardDescription(props: CardDescriptionProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      data-sw-card-description
      className={cardDescription({ class: className })}
      {...rest}
      ref={ref}
      data-slot="card-description"
    >
      {children}
    </div>
  );
}

export default CardDescription;
