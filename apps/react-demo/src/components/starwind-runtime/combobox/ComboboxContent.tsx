import ComboboxPrimitive from "@starwind-ui/react/combobox";
import type * as React from "react";
import { comboboxContent, comboboxList } from "./variants";

export type ComboboxContentProps = React.ComponentPropsWithoutRef<"div"> & {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  avoidCollisions?: boolean;
  keepMounted?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  size?: "sm" | "md" | "lg";
};

function ComboboxContent(props: ComboboxContentProps) {
  const {
    align = "start",
    alignOffset = 0,
    avoidCollisions = true,
    className,
    keepMounted = false,
    side = "bottom",
    sideOffset = 4,
    size = "md",
    children,
    ...rest
  } = props;

  return (
    <ComboboxPrimitive.Portal data-slot="combobox-portal">
      <ComboboxPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        side={side}
        sideOffset={sideOffset}
        data-slot="combobox-positioner"
      >
        <ComboboxPrimitive.Popup
          className={comboboxContent({ size, class: className })}
          align={align}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          keepMounted={keepMounted}
          side={side}
          sideOffset={sideOffset}
          {...rest}
          data-slot="combobox-content"
        >
          <ComboboxPrimitive.List className={comboboxList()} data-slot="combobox-list">
            {children}
          </ComboboxPrimitive.List>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

export default ComboboxContent;
