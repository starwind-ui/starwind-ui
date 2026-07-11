import CollapsiblePrimitive from "@starwind-ui/react/collapsible";
import type * as React from "react";
import { collapsibleContent } from "./variants";

export type CollapsibleContentProps = React.ComponentPropsWithoutRef<"div">;

function CollapsibleContent(props: CollapsibleContentProps) {
  const { className, children, ...rest } = props;

  return (
    <CollapsiblePrimitive.Panel
      className={collapsibleContent({ class: className })}
      {...rest}
      data-slot="collapsible-content"
    >
      {children}
    </CollapsiblePrimitive.Panel>
  );
}

export default CollapsibleContent;
