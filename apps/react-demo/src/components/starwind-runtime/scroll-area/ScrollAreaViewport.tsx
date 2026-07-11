import type * as React from "react";
import "./styles.css";
import ScrollAreaPrimitive from "@starwind-ui/react/scroll-area";
import { scrollAreaViewport } from "./variants";

export type ScrollAreaViewportProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ScrollAreaViewport(props: ScrollAreaViewportProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <ScrollAreaPrimitive.Viewport
      className={scrollAreaViewport({ class: className })}
      {...rest}
      ref={ref}
      data-slot="scroll-area-viewport"
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
  );
}

export default ScrollAreaViewport;
