import ScrollAreaPrimitive from "@starwind-ui/react/scroll-area";
import type * as React from "react";
import { scrollAreaCorner } from "./variants";

export type ScrollAreaCornerProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ScrollAreaCorner(props: ScrollAreaCornerProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <ScrollAreaPrimitive.Corner
      className={scrollAreaCorner({ class: className })}
      {...rest}
      ref={ref}
      data-slot="scroll-area-corner"
    >
      {children}
    </ScrollAreaPrimitive.Corner>
  );
}

export default ScrollAreaCorner;
