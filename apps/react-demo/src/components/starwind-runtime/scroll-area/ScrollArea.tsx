import type * as React from "react";
import "./styles.css";
import ScrollAreaPrimitive from "@starwind-ui/react/scroll-area";
import {
  scrollArea,
  scrollAreaContent,
  scrollAreaCorner,
  scrollAreaScrollbar,
  scrollAreaThumb,
  scrollAreaViewport,
} from "./variants";

export type ScrollAreaProps = React.ComponentPropsWithoutRef<"div"> & {
  overflowEdgeThreshold?: number;
  viewportClassName?: string;
  ref?: React.Ref<HTMLDivElement>;
  scrollbar?: React.ReactNode;
};

function ScrollArea(props: ScrollAreaProps) {
  const { overflowEdgeThreshold, viewportClassName, ref, className, children, scrollbar, ...rest } =
    props;

  return (
    <ScrollAreaPrimitive.Root
      className={scrollArea({ class: className })}
      overflowEdgeThreshold={overflowEdgeThreshold}
      {...rest}
      ref={ref}
      data-slot="scroll-area"
    >
      <ScrollAreaPrimitive.Viewport
        className={scrollAreaViewport({ class: viewportClassName })}
        data-slot="scroll-area-viewport"
      >
        <ScrollAreaPrimitive.Content
          className={scrollAreaContent()}
          data-slot="scroll-area-content"
        >
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>

      {scrollbar ?? (
        <ScrollAreaPrimitive.Scrollbar
          className={scrollAreaScrollbar()}
          data-slot="scroll-area-scrollbar"
        >
          <ScrollAreaPrimitive.Thumb className={scrollAreaThumb()} data-slot="scroll-area-thumb" />
        </ScrollAreaPrimitive.Scrollbar>
      )}

      <ScrollAreaPrimitive.Corner className={scrollAreaCorner()} data-slot="scroll-area-corner" />
    </ScrollAreaPrimitive.Root>
  );
}

export default ScrollArea;
