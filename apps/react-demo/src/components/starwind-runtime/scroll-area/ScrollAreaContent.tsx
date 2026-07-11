import ScrollAreaPrimitive from "@starwind-ui/react/scroll-area";
import type * as React from "react";
import { scrollAreaContent } from "./variants";

export type ScrollAreaContentProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function ScrollAreaContent(props: ScrollAreaContentProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <ScrollAreaPrimitive.Content
      className={scrollAreaContent({ class: className })}
      {...rest}
      ref={ref}
      data-slot="scroll-area-content"
    >
      {children}
    </ScrollAreaPrimitive.Content>
  );
}

export default ScrollAreaContent;
