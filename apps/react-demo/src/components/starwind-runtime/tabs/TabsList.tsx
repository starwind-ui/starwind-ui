import TabsPrimitive from "@starwind-ui/react/tabs";
import type * as React from "react";
import { tabsList } from "./variants";

export type TabsListProps = React.ComponentPropsWithoutRef<"div"> & {
  activateOnFocus?: boolean;
  loopFocus?: boolean;
  ref?: React.Ref<HTMLDivElement>;
};

function TabsList(props: TabsListProps) {
  const { activateOnFocus, loopFocus, ref, className, children, ...rest } = props;

  return (
    <TabsPrimitive.List
      className={tabsList({ class: className })}
      activateOnFocus={activateOnFocus}
      loopFocus={loopFocus}
      ref={ref}
      {...rest}
      data-slot="tabs-list"
    >
      {children}
    </TabsPrimitive.List>
  );
}

export default TabsList;
