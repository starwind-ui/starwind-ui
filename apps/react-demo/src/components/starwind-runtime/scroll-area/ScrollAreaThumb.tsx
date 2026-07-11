import ScrollAreaPrimitive from "@starwind-ui/react/scroll-area";
import type * as React from "react";
import { scrollAreaThumb } from "./variants";

export type ScrollAreaThumbProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <ScrollAreaPrimitive.Thumb
      className={scrollAreaThumb({ class: className })}
      {...rest}
      ref={ref}
      data-slot="scroll-area-thumb"
    >
      {children}
    </ScrollAreaPrimitive.Thumb>
  );
}

export default ScrollAreaThumb;
