import TabsPrimitive from "@starwind-ui/react/tabs";
import type * as React from "react";
import { tabsContent } from "./variants";

export type TabsContentProps = React.ComponentPropsWithoutRef<"div"> & {
  keepMounted?: boolean;
  ref?: React.Ref<HTMLDivElement>;
  value: string;
};

function TabsContent(props: TabsContentProps) {
  const { keepMounted, ref, value, className, children, ...rest } = props;

  return (
    <TabsPrimitive.Panel
      className={tabsContent({ class: className })}
      keepMounted={keepMounted}
      ref={ref}
      value={value}
      {...rest}
      data-slot="tabs-content"
    >
      {children}
    </TabsPrimitive.Panel>
  );
}

export default TabsContent;
