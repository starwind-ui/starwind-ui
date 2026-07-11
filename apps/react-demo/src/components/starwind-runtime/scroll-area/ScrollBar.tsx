import ScrollAreaPrimitive from "@starwind-ui/react/scroll-area";
import type * as React from "react";
import { scrollAreaScrollbar, scrollAreaThumb } from "./variants";

export type ScrollBarProps = React.ComponentPropsWithoutRef<"div"> & {
  keepMounted?: boolean;
  orientation?: "horizontal" | "vertical";
  ref?: React.Ref<HTMLDivElement>;
};

function ScrollBar(props: ScrollBarProps) {
  const {
    keepMounted = false,
    orientation = "vertical",
    ref,
    className,
    children,
    ...rest
  } = props;

  return (
    <ScrollAreaPrimitive.Scrollbar
      className={scrollAreaScrollbar({ class: className })}
      keepMounted={keepMounted}
      orientation={orientation}
      {...rest}
      ref={ref}
      data-orientation={orientation}
      data-slot="scroll-area-scrollbar"
    >
      {children ?? (
        <ScrollAreaPrimitive.Thumb className={scrollAreaThumb()} data-slot="scroll-area-thumb" />
      )}
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export default ScrollBar;
