import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { separator } from "./variants";

export type SeparatorProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "role" | "aria-orientation"
> &
  VariantProps<typeof separator> & {
    "data-slot"?: string;
    ref?: React.Ref<HTMLDivElement>;
  };

function Separator(props: SeparatorProps) {
  const {
    orientation = "horizontal",
    "data-slot": dataSlot = "separator",
    ref,
    className,
    ...rest
  } = props;

  return (
    <div
      data-sw-separator
      role="separator"
      aria-orientation={orientation}
      data-orientation={orientation}
      className={separator({ orientation, class: className })}
      {...rest}
      ref={ref}
      data-slot={dataSlot}
    />
  );
}

export default Separator;
