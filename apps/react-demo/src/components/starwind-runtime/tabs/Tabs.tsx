import TabsPrimitive from "@starwind-ui/react/tabs";
import type * as React from "react";
import { tabs } from "./variants";

export type TabsProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange" | "value"
> & {
  defaultValue?: import("@starwind-ui/react/tabs").TabsValue;
  onValueChange?: (
    value: import("@starwind-ui/react/tabs").TabsValue,
    details: import("@starwind-ui/react/tabs").TabsValueChangeDetails,
  ) => void;
  orientation?: "horizontal" | "vertical";
  ref?: React.Ref<HTMLDivElement>;
  syncKey?: string;
  value?: import("@starwind-ui/react/tabs").TabsValue;
};

function Tabs(props: TabsProps) {
  const {
    defaultValue,
    onValueChange,
    orientation = "horizontal",
    ref,
    syncKey,
    value,
    className,
    children,
    ...rest
  } = props;

  return (
    <TabsPrimitive.Root
      className={tabs({ class: className })}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      orientation={orientation}
      ref={ref}
      syncKey={syncKey}
      value={value}
      {...rest}
      data-slot="tabs"
    >
      {children}
    </TabsPrimitive.Root>
  );
}

export default Tabs;
