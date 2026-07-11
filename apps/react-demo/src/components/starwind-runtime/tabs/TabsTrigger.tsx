import TabsPrimitive from "@starwind-ui/react/tabs";
import type * as React from "react";
import { tabsTrigger } from "./variants";

export type TabsTriggerProps = Omit<React.ComponentPropsWithoutRef<"button">, "type" | "value"> & {
  disabled?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
  value: string;
};

function TabsTrigger(props: TabsTriggerProps) {
  const { disabled = false, ref, value, className, children, ...rest } = props;

  return (
    <TabsPrimitive.Tab
      className={tabsTrigger({ class: className })}
      disabled={disabled}
      ref={ref}
      value={value}
      {...rest}
      data-slot="tabs-trigger"
    >
      {children}
    </TabsPrimitive.Tab>
  );
}

export default TabsTrigger;
