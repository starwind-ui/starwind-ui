import SelectPrimitive from "@starwind-ui/react/select";
import type * as React from "react";
import { selectContent, selectList } from "./variants";

export type SelectContentProps = React.ComponentPropsWithoutRef<"div"> & {
  align?: "start" | "center" | "end";
  alignOffset?: number;
  alignItemWithTrigger?: boolean;
  avoidCollisions?: boolean;
  keepMounted?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  size?: "sm" | "md" | "lg";
};

function SelectContent(props: SelectContentProps) {
  const {
    align = "start",
    alignOffset = 0,
    alignItemWithTrigger = true,
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
    <SelectPrimitive.Portal data-slot="select-portal">
      <SelectPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        avoidCollisions={avoidCollisions}
        side={side}
        sideOffset={sideOffset}
        data-slot="select-positioner"
      >
        <SelectPrimitive.Popup
          className={selectContent({ size, class: className })}
          align={align}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          keepMounted={keepMounted}
          side={side}
          sideOffset={sideOffset}
          data-align-trigger={alignItemWithTrigger ? "true" : "false"}
          {...rest}
          data-slot="select-content"
        >
          <SelectPrimitive.List className={selectList()} data-slot="select-list">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export default SelectContent;
